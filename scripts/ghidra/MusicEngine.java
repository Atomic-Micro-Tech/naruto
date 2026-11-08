import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class MusicEngine extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x80017c54L,0x80017dc4L,0x80017ee0L,0x80017f04L,0x80019c10L,0x80018800L,0x8001860cL,0x80018674L,0x80018734L,0x800182d4L};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  for(int pass=0;pass<3;pass++)for(var f:currentProgram.getFunctionManager().getFunctions(true)){
   long a=f.getEntryPoint().getOffset();if(a<0x80017c54L||a>=0x80019100L)continue;
   for(var i:currentProgram.getListing().getInstructions(f.getBody(),true))for(var r:i.getReferencesFrom())if(r.getReferenceType().isCall()){
    long t=r.getToAddress().getOffset();if(t>=0x80017000L&&t<0x8001a000L){disassemble(r.getToAddress());if(getFunctionAt(r.getToAddress())==null)createFunction(r.getToAddress(),null);}
   }
  }
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/MUSIC.c")){
   for(var f:currentProgram.getFunctionManager().getFunctions(true)){
    long a=f.getEntryPoint().getOffset();if(a<0x80017000L||a>=0x8001a000L)continue;
    var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());
   }
  }
 }
}
