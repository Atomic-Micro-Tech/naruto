import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class BoardSpriteHelpers extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x8001a648L,0x8001a764L,0x8001a7a0L,0x80022aa8L,0x80022510L,0x80022774L};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/BOARD_SPRITE_HELPERS.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());}
  }
 }
}
