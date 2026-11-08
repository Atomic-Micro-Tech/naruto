import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class TreasureHelpers extends GhidraScript {
 public void run() throws Exception {
  long[] aa=new long[]{0x80012904L,0x8001eab0L,0x8001ef38L,0x80023778L,0x800193f0L,0x80019198L,0x80019254L,0x800192c8L,0x800150ccL,0x80014e8cL,0x80015024L,0x80015408L,0x80014818L};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/TREASURE_HELPERS.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());}
  }
 }
}
