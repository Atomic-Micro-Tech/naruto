import ghidra.app.script.GhidraScript;
public class StoryEntry extends GhidraScript {
 public void run() throws Exception {
  long[] entries={0x800adc74L,0x800adf3cL,0x800af3b0L,0x800af9d4L};
  for(long a:entries){var addr=toAddr(a);addEntryPoint(addr);disassemble(addr);createFunction(addr,null);}
 }
}
