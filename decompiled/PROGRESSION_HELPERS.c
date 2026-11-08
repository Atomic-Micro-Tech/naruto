/* 80016b38 */

void FUN_80016b38(undefined2 param_1)

{
  DAT_80070748._2_2_ = param_1;
  return;
}


/* 80016b44 */

undefined2 FUN_80016b44(void)

{
  return DAT_80070748._2_2_;
}


/* 80016b54 */

undefined4 FUN_80016b54(uint param_1,undefined2 param_2)

{
  if ((param_1 & 0xff) < 0xd) {
    *(undefined2 *)((int)&DAT_8007074c + (param_1 & 0xff) * 2) = param_2;
    return 1;
  }
  return 0;
}


/* 80016b88 */

undefined2 FUN_80016b88(uint param_1)

{
  if ((param_1 & 0xff) < 0xd) {
    return *(undefined2 *)((int)&DAT_8007074c + (param_1 & 0xff) * 2);
  }
  return 0;
}


/* 80016bb8 */

undefined4 FUN_80016bb8(uint param_1,undefined2 param_2)

{
  if ((param_1 & 0xff) < 5) {
    *(undefined2 *)(&UNK_80070766 + (param_1 & 0xff) * 2) = param_2;
    return 1;
  }
  return 0;
}


/* 80016bec */

undefined2 FUN_80016bec(uint param_1)

{
  if ((param_1 & 0xff) < 5) {
    return *(undefined2 *)(&UNK_80070766 + (param_1 & 0xff) * 2);
  }
  return 0;
}


/* 80016cf8 */

undefined4 FUN_80016cf8(uint param_1)

{
  undefined4 uVar1;
  
  if (param_1 < 0x38) {
    uVar1 = FUN_80016c1c();
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 80016d2c */

undefined4 FUN_80016d2c(uint param_1)

{
  undefined4 uVar1;
  
  if (param_1 < 0x38) {
    uVar1 = FUN_80016c68();
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 80016d60 */

int FUN_80016d60(void)

{
  int iVar1;
  uint uVar2;
  int iVar3;
  
  iVar3 = 0;
  uVar2 = 0;
  do {
    iVar1 = FUN_80016d2c(uVar2);
    if (iVar1 != 0) {
      iVar3 = iVar3 + 1;
    }
    uVar2 = uVar2 + 1;
  } while (uVar2 < 0x38);
  return iVar3;
}


/* 80016da4 */

void FUN_80016da4(void)

{
  return;
}


/* 80016de4 */

undefined4 FUN_80016de4(uint param_1)

{
  undefined4 uVar1;
  
  param_1 = param_1 & 0xff;
  if (param_1 < 0xd) {
    uVar1 = 1;
    if (3 < param_1) {
      uVar1 = FUN_80016c1c(param_1 + 0x34);
    }
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 80012444 */

/* Possible GS_125.OBJ/GsGetWorkBase
   Possible SSVM_2.OBJ/SsGetVoiceMask */

undefined4 FUN_80012444(void)

{
  return DAT_80070734;
}


/* 800126e8 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_800126e8(void)

{
  return DAT_8007073c;
}


/* 8001519c */

undefined2 FUN_8001519c(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 5)) {
    return *(undefined2 *)(&UNK_80070f1e + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}


/* 80014888 */

undefined2 FUN_80014888(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 4)) {
    return *(undefined2 *)(&UNK_80070eea + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}


/* 80013380 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined2 FUN_80013380(void)

{
  return _UNK_80070e90;
}


/* 800152c8 */

undefined1 FUN_800152c8(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 4)) {
    return (&UNK_80070f2e)[(param_2 & 0xff) + (param_1 & 0xff) * 0xb4];
  }
  return 0;
}


/* 80015460 */

undefined1 FUN_80015460(uint param_1,uint param_2)

{
  param_2 = param_2 & 0xff;
  if ((((param_1 & 0xff) < 4) && (param_2 != 0)) && (param_2 < 0xd)) {
    return (&UNK_80070f39)[param_2 + (param_1 & 0xff) * 0xb4];
  }
  return 0;
}


/* 80014ed0 */

undefined2 FUN_80014ed0(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined2 *)(&UNK_80070f2a + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}


/* 80015234 */

undefined2 FUN_80015234(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return *(undefined2 *)(&UNK_80070f2c + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}


/* 80015078 */

undefined2 FUN_80015078(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 0xe)) {
    return *(undefined2 *)(&UNK_80070f02 + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  }
  return 0;
}


/* 8001a2d8 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_8001a2d8(void)

{
  return UNK_80089daa;
}


/* 80017144 */

uint FUN_80017144(uint param_1)

{
  uint uVar1;
  uint uVar2;
  
  uVar2 = 0;
  while( true ) {
    uVar1 = func_0x800135e0();
    if (uVar1 <= uVar2) {
      return 0xff;
    }
    uVar1 = FUN_8001378c(uVar2);
    if (uVar1 == (param_1 & 0xff)) break;
    uVar2 = uVar2 + 1 & 0xff;
  }
  return uVar2;
}


