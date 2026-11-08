import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class Story1Helpers extends GhidraScript {
 public void run() throws Exception {
  long[] aa=new long[]{0x80013488L,0x80013464L,0x80012c14L,0x80012c54L,0x80012eacL,0x80014098L};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/STORY1_HELPERS.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());}
  }
 }
}
