"""Validate synthetic integration captures against the project's unchanged OpenAPI."""
import argparse
import json
import re
import warnings
from pathlib import Path

import yaml
import jsonschema

parser = argparse.ArgumentParser()
parser.add_argument("capture", type=Path)
args = parser.parse_args()
spec = yaml.safe_load((Path(__file__).resolve().parents[2] / "api/naruto.yaml").read_text())
warnings.filterwarnings("ignore", category=DeprecationWarning)
resolver = jsonschema.RefResolver.from_schema(spec)

def resolve(value):
    while "$ref" in value:
        target = spec
        for part in value["$ref"][2:].split("/"):
            target = target[part.replace("~1", "/").replace("~0", "~")]
        value = target
    return value

count = 0
for line in args.capture.read_text().splitlines():
    record = json.loads(line)
    if record["kind"] == "ws":
        schema = {"$ref": "#/components/schemas/WsServerMessage"}
    else:
        path = record["path"].split("?")[0]
        matches = [
            operations for template, operations in spec["paths"].items()
            if re.fullmatch(re.sub(r"\{[^}]+\}", r"[^/]+", template), path)
        ]
        if path in spec["paths"]:
            matches = [spec["paths"][path]]
        assert len(matches) == 1, record
        operation = matches[0][record["method"].lower()]
        response = resolve(operation["responses"][str(record["status"])])
        content = response.get("content", {})
        if not content:
            assert record["body"] is None, record
            count += 1
            continue
        schema = content["application/json"]["schema"]
    validator = jsonschema.Draft202012Validator(
        schema, resolver=resolver, format_checker=jsonschema.FormatChecker()
    )
    errors = list(validator.iter_errors(record["body"]))
    if errors:
        raise AssertionError(
            f"record {count + 1} {record.get('method', 'WS')} {record.get('path', '')}: "
            + "; ".join(error.message for error in errors)
        )
    count += 1
print(f"Validated {count} HTTP responses and WebSocket messages against naruto.yaml")
