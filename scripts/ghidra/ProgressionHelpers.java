import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class ProgressionHelpers extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x80016b38L,0x80016b44L,0x80016b54L,0x80016b88L,0x80016bb8L,0x80016becL,0x80016cf8L,0x80016d2cL,0x80016d60L,0x80016da4L,0x80016de4L,0x80012444L,0x800126e8L,0x8001519cL,0x80014888L,0x80013380L,0x800152c8L,0x80015460L,0x80014ed0L,0x80015234L,0x80015078L,0x8001a2d8L,0x80017144L};

  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/PROGRESSION_HELPERS.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());}
  }
 }
}
