import java.io.*;
import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.Function;
public class ExportMenu extends GhidraScript {
 public void run() throws Exception {
  DecompInterface d=new DecompInterface();d.openProgram(currentProgram);int n=0;
  try(PrintWriter pw=new PrintWriter(getScriptArgs()[0])){
   for(Function f:currentProgram.getFunctionManager().getFunctions(true)){
    var r=d.decompileFunction(f,30,monitor);pw.println("/* "+f.getEntryPoint()+" */");
    if(r.getDecompiledFunction()!=null)pw.println(r.getDecompiledFunction().getC());n++;
   }
  }println("Exported "+n);
 }
}
