import ghidra.app.script.GhidraScript;
public class MenuEntry extends GhidraScript {
 public void run() throws Exception {
  long[] addresses={0x800ad748L,0x800ad9a4L,0x800af640L,0x800af748L,0x800c41acL,0x800c43b8L,0x800c1d9cL,0x800c2014L,0x800c6054L,0x800c6294L,0x800c6738L,0x800c6774L};
  for(long a:addresses){var addr=toAddr(a);addEntryPoint(addr);disassemble(addr);createFunction(addr,null);}
 }
}
