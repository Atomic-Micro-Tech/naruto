import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class UiHelpers extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x8001fc60L,0x8001a98cL,0x8001aad4L,0x8001ad94L,0x8001b0b4L,0x8001b364L,0x8001b6c8L,0x8001c4a4L,0x80022ed4L,0x80023320L,0x800221e0L,0x80022548L,0x800227f0L};
  for(long a:aa){var addr=toAddr(a);disassemble(addr);if(getFunctionAt(addr)==null)createFunction(addr,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter pw=new PrintWriter("/Users/shukino/RE/naruto/decompiled/UI_HELPERS.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());}
  }
 }
}
