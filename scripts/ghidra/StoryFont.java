import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class StoryFont extends GhidraScript {
 public void run() throws Exception {
  long[] aa={0x8001ac98L,0x8001ace4L,0x8001ad94L,0x8001add8L,0x8001b0b4L};
  for(long a:aa){var x=toAddr(a);disassemble(x);if(getFunctionAt(x)==null)createFunction(x,null);}
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  try(PrintWriter w=new PrintWriter("/Users/shukino/RE/naruto/decompiled/STORY_FONT.c")){
   for(long a:aa){var f=getFunctionAt(toAddr(a));var r=d.decompileFunction(f,30,monitor);w.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)w.println(r.getDecompiledFunction().getC());}
  }
 }
}
