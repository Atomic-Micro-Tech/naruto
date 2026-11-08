import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class PartyCasualAudit extends GhidraScript {
 public void run() throws Exception {
 long[] aa={0x8001a19cL,0x8001a1bcL,0x8001a1e4L,0x8001a1f0L,0x8001a250L,0x8001a274L,0x80013610L,0x80013e48L,0x8001a2c8L,0x800150ccL,0x8001519cL,0x80015234L};
 for(long a:aa){var x=toAddr(a);disassemble(x);if(getFunctionAt(x)==null)createFunction(x,null);}
 DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
 try(PrintWriter p=new PrintWriter(getScriptArgs()[0])){for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,30,monitor);p.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)p.println(r.getDecompiledFunction().getC());}}
 d.dispose();
 }
}
