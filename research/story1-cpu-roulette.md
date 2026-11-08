# Story0 CPU movement roulette

`story1-cpu-roulette.mjs` ports BOARD800cb4b4 (nonjunction lookahead),800cad18 (skill gate), and800f3658 case5 state0 (fallback and target assignment). Map0 has22 tiles and no type3 junction, so the recovered lookahead covers every tile type reachable in the first story stage. This is source-derived decision logic, not evidence of console replay identity.

Integration: call `cpuBoardRouletteTarget(state,actor,{faces,reserveByte,crystalCount,skillByte:movementRouletteSkill(boardAiData,characterId),priorBoardState:2})` BEFORE `startBoardRoulette`. Commit result.rngState and supply result.targetValue to the wheel. State uses the same position/direction and native four-slot neighbors contract as the other CPU helpers. `faces` must be the original current12 slot values before the next shuffle, including any roulette status replacement. `reserveByte` is board byte1*25 narrowed tobyte; skillByte is board byte0*25 narrowed tobyte, populated in BOARD800b5790 from main800162e4.

The policy scans only faces0..10 to find min/max. Wallet<700, missing exactly one crystal, or all crystals collected chooses `max-rand()%3`. Otherwise it scores directed tiles. Known direction initially scores the current tile against the minimum roll value, then advances. Direction255 first moves one neighbor and initializes a four-pass outer loop; the source retains its mutated cursor and direction across those passes rather than returning to the origin. MIPS800cb714..800cbe78 confirms this unusual behavior. Tests preserve it.

Scores: source/crystal `100*value+500` if actor owns a barrier, otherwise0; chance `100*value+400`; unowned land `trunc(price*((reserve+1)/180)+1000+100*value)` if affordable; own upgradable barrier `100*value+chainRent+2000`; enemy barrier `10*value-chainRent`, plus10000 for a scroll holder in mode8. Connector `100*value`; special barrier `100*value+100000`. Trap effects2/8/9 reset these scores to0 (except connector). First strict maximum wins. A level5 owned barrier has no candidate score.

After lookahead, exactly one skill draw is consumed; target is discarded when `skillByte <= rand()%250`. A discarded target gets one uniform integer draw in the first11faces' min..max range. This differs from uniform selection of a face slot. If a successful desired target is absent in those first11faces, the original uses face10. The setter8010be90 searches all12faces; if a requested value is absent it preserves its previous target. The helper exposes setterSucceeded and accepts previousTarget for that edge case.

Board previous states1 and14 skip lookahead and the skill draw but still perform the random fallback. This helper does not perform widget shuffle/startup, hammer jitter, particle, or combat RNG. Existing faithful-roulette.mjs handles its own callbacks separately.

Junction800cadb8 is explicitly unsupported here. That routine depends on caller registers for some candidate scores. Story0 does not reach it. An invalid directional byte produces an explicit error; no BFS or guessed reverse-neighbor fallback is inserted.

Validation: `node --test research/story1-cpu-roulette.test.mjs` (8 cases), including the complete real map0 structure, no-junction property, direction255 retained state, known-direction first tile, crystal/wallet shortcut, skill/fallback RNG count, and twelfth-face exclusion.
