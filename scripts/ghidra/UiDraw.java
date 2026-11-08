import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class UiDraw extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x8001fd0cL,0x8001a9ccL,0x8001ab60L,0x8001b39cL,0x8001b720L,0x8001bb9cL,0x8001bc84L,0x8001c21cL,0x8001c7f8L,0x8001cbfcL,0x80022cccL};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/UI_DRAW.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());}
  }
 }
}
