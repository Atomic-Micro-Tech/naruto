import java.io.*;import ghidra.app.decompiler.*;import ghidra.app.script.GhidraScript;
public class Story1Audio extends GhidraScript {public void run() throws Exception {
 long[] aa={0x800190fcL,0x80013488L,0x800182a8L,0x80018848L,0x80018890L,0x800188f0L,0x80018968L,0x80018c00L,0x80018c58L,0x80018190L,0x8001f4b8L,0x8001f568L,0x8001f770L};
 for(long a:aa){var x=toAddr(a);disassemble(x);if(getFunctionAt(x)==null)createFunction(x,null);}
 DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
 try(PrintWriter w=new PrintWriter("/Users/shukino/RE/naruto/decompiled/STORY1_AUDIO.c")){for(long a:aa){var f=getFunctionAt(toAddr(a));var r=d.decompileFunction(f,30,monitor);w.println("/* "+f.getEntryPoint()+" */");if(r.getDecompiledFunction()!=null)w.println(r.getDecompiledFunction().getC());}}
}}
