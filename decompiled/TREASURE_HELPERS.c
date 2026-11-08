/* 80012904 */

/* Possible GS_125.OBJ/GsGetWorkBase
   Possible SSVM_2.OBJ/SsGetVoiceMask */

undefined4 FUN_80012904(void)

{
  return DAT_80070730;
}


/* 8001eab0 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool FUN_8001eab0(void)

{
  int iVar1;
  
  iVar1 = func_0x8001e9a0();
  if (iVar1 != 0) {
    _UNK_800a15fc = 1;
    _UNK_800a1600 = 0;
  }
  return iVar1 != 0;
}


/* 8001ef38 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4
FUN_8001ef38(undefined4 param_1,uint param_2,uint param_3,undefined4 param_4,undefined4 param_5)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  
  if (param_2 != 0) {
    if (param_3 == 0) {
      return 0;
    }
    uVar6 = param_2;
    uVar3 = FUN_8002dbb8(param_1);
    if ((int)uVar3 < 1) {
      return 0;
    }
    uVar5 = uVar3;
    _UNK_800a15e8 = FUN_8002df30();
    if (_UNK_800a15e8 != 0) {
      uVar1 = param_2 + 3 & 3;
      uVar2 = param_2 & 3;
      _UNK_800a15ec =
           (*(int *)((param_2 + 3) - uVar1) << (3 - uVar1) * 8 |
           uVar5 & 0xffffffffU >> (uVar1 + 1) * 8) & -1 << (4 - uVar2) * 8 |
           *(uint *)(param_2 - uVar2) >> uVar2 * 8;
      uVar5 = param_2 + 7 & 3;
      uVar1 = param_2 + 4 & 3;
      _UNK_800a15f0 =
           (*(int *)((param_2 + 7) - uVar5) << (3 - uVar5) * 8 |
           uVar6 & 0xffffffffU >> (uVar5 + 1) * 8) & -1 << (4 - uVar1) * 8 |
           *(uint *)((param_2 + 4) - uVar1) >> uVar1 * 8;
      uVar6 = param_3 + 3 & 3;
      uVar5 = param_3 & 3;
      _UNK_800a15f4 =
           (*(int *)((param_3 + 3) - uVar6) << (3 - uVar6) * 8 |
           _UNK_800a15ec & 0xffffffffU >> (uVar6 + 1) * 8) & -1 << (4 - uVar5) * 8 |
           *(uint *)(param_3 - uVar5) >> uVar5 * 8;
      uVar6 = param_3 + 7 & 3;
      uVar5 = param_3 + 4 & 3;
      _UNK_800a15f8 =
           (*(int *)((param_3 + 7) - uVar6) << (3 - uVar6) * 8 |
           _UNK_800a15f0 & 0xffffffffU >> (uVar6 + 1) * 8) & -1 << (4 - uVar5) * 8 |
           *(uint *)((param_3 + 4) - uVar5) >> uVar5 * 8;
      _UNK_800a1604 = param_4;
      iVar4 = FUN_8002d838(param_1,_UNK_800a15e8,uVar3,&UNK_8001f048,param_5);
      if (iVar4 != 0) {
        return 1;
      }
      FUN_8002dfe4(_UNK_800a15e8);
      _UNK_800a15e8 = 0;
    }
  }
  return 0;
}


/* 80023778 */

undefined4 FUN_80023778(short param_1,short param_2,GsOT *param_3,ushort param_4)

{
  int iVar1;
  int iVar2;
  GsSPRITE GStack_48;
  
  GStack_48.tpage = 0x15;
  GStack_48.u = 'x';
  GStack_48.v = 0xae;
  GStack_48.w = 0x1c;
  GStack_48.h = 0x1a;
  GStack_48.mx = 0xe;
  GStack_48.my = 0xd;
  GStack_48.scalex = 0x1000;
  GStack_48.scaley = 0x1000;
  GStack_48.rotate = 0;
  iVar1 = VSync(-1);
  iVar1 = rsin((iVar1 * 0x1000) / 0x1e);
  iVar2 = VSync(-1);
  iVar2 = rsin((iVar2 * 0x1000) / 0x1e);
  GStack_48.attribute = 0;
  GStack_48.cx = 0x60;
  GStack_48.cy = 0x1fe;
  GStack_48.b = 0x80;
  GStack_48.g = 0x80;
  GStack_48.r = 0x80;
  param_1 = param_1 + (short)(-iVar1 / 0x555);
  param_2 = param_2 + (short)(iVar2 / 0x555);
  GStack_48.x = param_1;
  GStack_48.y = param_2;
  GsSortSprite(&GStack_48,param_3,param_4);
  GStack_48.attribute = 0x40000000;
  GStack_48.cx = 0xf0;
  GStack_48.cy = 0x1fe;
  GStack_48.b = '\0';
  GStack_48.g = '\0';
  GStack_48.r = '\0';
  GStack_48.x = param_1 + 2;
  GStack_48.y = param_2 + 2;
  GsSortSprite(&GStack_48,param_3,param_4);
  return 1;
}


/* 800193f0 */

void FUN_800193f0(uint param_1)

{
  FUN_800191b0((uint)UNK_80064d56 * 0x10 + (param_1 & 0xff));
  return;
}


/* 80019198 */

bool FUN_80019198(void)

{
  return DAT_80071890 == 5;
}


/* 80019254 */

undefined4 FUN_80019254(void)

{
  undefined4 uVar1;
  int iVar2;
  
  uVar1 = 0;
  if (DAT_80071890 == 5) {
    FUN_80017b08(0xff);
    iVar2 = CdControl('\x1b',&DAT_8007188c,(u_char *)0x0);
    if (iVar2 == 1) {
      DAT_80071890 = 6;
      DsPosToInt((DslLOC *)&DAT_8007188c);
      uVar1 = 1;
    }
    else {
      uVar1 = 0;
    }
  }
  return uVar1;
}


/* 800192c8 */

bool FUN_800192c8(void)

{
  bool bVar1;
  
  bVar1 = DAT_80071890 == 6;
  if (bVar1) {
    FUN_80017b50(0xff,0,5,&LAB_80019324);
    DAT_80071890 = 7;
  }
  return bVar1;
}


/* 800150cc */

undefined4 FUN_800150cc(uint param_1,uint param_2)

{
  short *psVar1;
  
  if ((3 < (param_1 & 0xff)) || (4 < (param_2 & 0xff))) {
    return 0;
  }
  psVar1 = (short *)(&UNK_80070f1e + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  if (*psVar1 != -1) {
    *psVar1 = *psVar1 + 1;
  }
  return 1;
}


/* 80014e8c */

undefined4 FUN_80014e8c(uint param_1,undefined2 param_2)

{
  if ((param_1 & 0xff) < 4) {
    *(undefined2 *)(&UNK_80070f2a + (param_1 & 0xff) * 0xb4) = param_2;
    return 1;
  }
  return 0;
}


/* 80015024 */

undefined4 FUN_80015024(undefined4 param_1,uint param_2,undefined2 param_3,uint param_4)

{
  if ((param_4 < 4) && ((param_2 & 0xff) < 0xe)) {
    *(undefined2 *)(&UNK_80070f02 + (param_2 & 0xff) * 2 + param_4 * 0xb4) = param_3;
    return 1;
  }
  return 0;
}


/* 80015408 */

undefined4 FUN_80015408(undefined4 param_1,uint param_2,undefined1 param_3,uint param_4)

{
  param_2 = param_2 & 0xff;
  if (((param_4 < 4) && (param_2 != 0)) && (param_2 < 0xd)) {
    (&UNK_80070f39)[param_2 + param_4 * 0xb4] = param_3;
    return 1;
  }
  return 0;
}


/* 80014818 */

undefined4 FUN_80014818(uint param_1,uint param_2)

{
  short *psVar1;
  
  if (3 < (param_1 & 0xff)) {
    return 0;
  }
  psVar1 = (short *)(&UNK_80070eea + (param_2 & 0xff) * 2 + (param_1 & 0xff) * 0xb4);
  if (*psVar1 != -1) {
    *psVar1 = *psVar1 + 1;
  }
  return 1;
}


