/* 8010bf0c */

undefined4 FUN_8010bf0c(undefined4 param_1)

{
  *(undefined4 *)(DAT_8013a648 + 0x48) = 2;
  func_0x80021190(param_1,0);
  return 1;
}


/* 8010bf40 */

undefined4 FUN_8010bf40(undefined4 param_1)

{
  int iVar1;
  
  iVar1 = DAT_8013a648;
  *(undefined4 *)(DAT_8013a648 + 0x48) = 6;
  *(undefined4 *)(iVar1 + 0x834) = 0;
  func_0x80021190(param_1,0);
  func_0x80020c90(DAT_8013a648);
  if (*(int *)(DAT_8013a648 + 0x50) != 0) {
    FUN_80119634(1);
  }
  return 1;
}


/* 8010bfa8 */

undefined4 FUN_8010bfa8(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  iVar3 = *(int *)(param_1 + 0x10);
  if (iVar3 != 0) {
    *(undefined4 *)(DAT_8013a648 + 0x48) = 2;
    func_0x80020c90();
    iVar1 = DAT_8013a648;
    *(undefined4 *)(DAT_8013a648 + 0x4c) = 0x3c;
    *(undefined4 *)(iVar1 + 0x48) = 4;
  }
  func_0x80020d1c(DAT_8013a648,4);
  func_0x80021190(param_1,0);
  *(undefined4 *)(DAT_8013a648 + iVar3 * 4 + 0x550) = 2;
  iVar1 = 0;
  do {
    if (*(int *)(DAT_8013a648 + 0x38) == 0) {
      FUN_8010c1c0(*(short *)(param_1 + 0xc) + -0x16,(int)*(short *)(param_1 + 0xe),0);
    }
    else {
      FUN_8010c1c0(*(short *)(param_1 + 0xc) + 0x16,(int)*(short *)(param_1 + 0xe),0x800);
    }
    iVar2 = DAT_8013a648;
    iVar1 = iVar1 + 1;
  } while (iVar1 < 0x14);
  *(undefined4 *)(DAT_8013a648 + 0x54) = 0x1000;
  iVar1 = 1;
  if (*(int *)(iVar2 + 0x38) != 0) {
    iVar1 = -1;
  }
  iVar2 = (int)*(short *)(DAT_8013a648 + 0x6c) + (iVar3 * 0x18 + 0x60) * iVar1;
  iVar1 = (int)*(short *)(DAT_8013a648 + 0x6e) + iVar3 * 0x18 + -0x48;
  FUN_8010c5c4(iVar2,iVar1,*(undefined4 *)(param_1 + 0x10),(2 - iVar3) * 2 + 0x19);
  if (iVar3 == 2) {
    FUN_8010c5c4(iVar2 + 0x18,iVar1 + 0x18,3,0x19);
  }
  func_0x80018300(0x4800,2,5,0,1);
  func_0x80018468(0,0xb4);
  iVar3 = *(short *)(param_1 + 0xc) + -0xa0;
  func_0x80018508(0,(iVar3 - (iVar3 >> 0x1f)) * 0x8000 >> 0x10);
  if (*(int *)(DAT_8013a648 + 0x58) != 0xff) {
    FUN_8010097c(*(undefined1 *)(DAT_8013a648 + 0x58),0);
  }
  return 1;
}


