import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
public class PartyFlowAudit extends GhidraScript {
 public void run() throws Exception {
 String[] args=getScriptArgs();
 long[] aa=args[1].equals("main") ? new long[]{0x80012904L,0x80012934L,0x80012c20L,0x80017034L,0x80019f38L,0x8001387cL,0x80012a70L} : new long[]{0x801125e8L,0x80113798L,0x801138b4L,0x801138ccL,0x80114390L,0x80110adcL,0x80110b98L,0x80112c50L};
 for(long a:aa){var x=toAddr(a);disassemble(x);if(getFunctionAt(x)==null)createFunction(x,null);}
 DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
 try(PrintWriter p=new PrintWriter(args[0])){for(long a:aa){var f=getFunctionAt(toAddr(a));if(f==null)continue;var r=d.decompileFunction(f,60,monitor);p.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)p.println(r.getDecompiledFunction().getC());}}
 d.dispose();
 }
}
