import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class StoryEngine extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x80026e24L,0x80027178L,0x80026984L,0x80012954L,0x80012974L,0x80024b10L,0x800251c8L,0x8002883cL,0x80023e60L,0x80023eb8L,0x80023f10L,0x80024164L,0x80024234L,0x80026338L,0x80026880L,0x800288c8L,0x800289a4L,0x80028a48L,0x80028a88L,0x80028aa8L,0x80028afcL,0x80028ba8L,0x80028c08L,0x8002bd44L,0x800190fcL,0x80012914L,0x80012934L};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  // Recover local callees recursively within the dialogue-engine code range.
  for(int pass=0;pass<4;pass++)for(var f:currentProgram.getFunctionManager().getFunctions(true)){
   long a=f.getEntryPoint().getOffset();if(a<0x80023e60L||a>=0x8002be00L)continue;
   for(var i:currentProgram.getListing().getInstructions(f.getBody(),true))for(var r:i.getReferencesFrom())if(r.getReferenceType().isCall()){
    long t=r.getToAddress().getOffset();if(t>=0x80023e60L&&t<0x8002be00L){disassemble(r.getToAddress());if(getFunctionAt(r.getToAddress())==null)createFunction(r.getToAddress(),null);}
   }
  }
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/STORY_ENGINE.c")){
   for(var f:currentProgram.getFunctionManager().getFunctions(true)){
    long a=f.getEntryPoint().getOffset();if((a<0x80023e60L||a>=0x8002be00L)&&a!=0x800190fcL&&a!=0x80012914L&&a!=0x80012934L&&a!=0x80012954L&&a!=0x80012974L)continue;
    var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());
   }
  }
 }
}
