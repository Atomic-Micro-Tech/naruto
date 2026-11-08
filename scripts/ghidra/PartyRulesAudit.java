import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;

/** Export missing Party setup helpers; run against the EXE project read-only. */
public class PartyRulesAudit extends GhidraScript {
 public void run() throws Exception {
  long[] addresses = {0x80012780L, 0x800129f4L,
   0x80012af0L, 0x80012b74L, 0x80012c70L, 0x800122e4L};
  for (long a : addresses) {
   var address = toAddr(a);
   disassemble(address);
   if (getFunctionAt(address) == null) createFunction(address, null);
  }
  DecompInterface decompiler = new DecompInterface();
  decompiler.openProgram(currentProgram);
  try (PrintWriter out = new PrintWriter(getScriptArgs()[0])) {
   for (long a : addresses) {
    var f = getFunctionAt(toAddr(a));
    if (f == null) continue;
    var result = decompiler.decompileFunction(f, 30, monitor);
    out.println("/* " + f.getEntryPoint() + " */");
    if (result.getDecompiledFunction() != null)
     out.println(result.getDecompiledFunction().getC());
   }
  }
  decompiler.dispose();
 }
}
