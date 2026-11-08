/* 800148dc */

undefined1 FUN_800148dc(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined1 *)((int)&DAT_80070ea8 + (param_1 & 0xff) * 0xb4 + 1);
  }
  return 0;
}


/* 800171a4 */

uint FUN_800171a4(uint param_1)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  
  uVar4 = 0;
  do {
    uVar3 = func_0x800135e0();
    if (uVar3 <= uVar4) {
      return 0xff;
    }
    if (uVar4 != (param_1 & 0xff)) {
      iVar1 = FUN_800148dc(uVar4);
      iVar2 = FUN_800148dc(param_1 & 0xff);
      if (iVar1 == iVar2) {
        return uVar4;
      }
    }
    uVar4 = uVar4 + 1 & 0xff;
  } while( true );
}


/* 80012ac0 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80012ac0(void)

{
  return DAT_80070c8c._1_1_;
}


/* 800138ec */

undefined4 FUN_800138ec(uint param_1)

{
  if (param_1 < 4) {
    return (&DAT_80070eb8)[param_1 * 0x2d];
  }
  return 0;
}


