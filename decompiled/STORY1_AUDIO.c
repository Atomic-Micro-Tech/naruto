/* 800190fc */

void FUN_800190fc(uint param_1,undefined4 param_2)

{
  param_1 = param_1 & 0xff;
  if (0xf < param_1) {
    param_1 = 0x10;
  }
  FUN_800185d4();
  FUN_800198e0(*(undefined2 *)(&UNK_80065480 + param_1 * 2),0x27750,0x2d800,3,0x4c00,0x6400,0x4c00,
               0x1000,param_2);
  return;
}


/* 80013488 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80013488(void)

{
  return DAT_80070cd1;
}


/* 800182a8 */

undefined1 FUN_800182a8(uint param_1)

{
  if ((param_1 & 0xff) < 0x1f) {
    return (&UNK_800653ac)[param_1 & 0xff];
  }
  return 0;
}


/* 80018848 */

undefined4 FUN_80018848(void)

{
  int iVar1;
  undefined4 uVar2;
  
  iVar1 = FUN_80018890(0);
  uVar2 = 0;
  if (iVar1 != 0) {
    while( true ) {
      iVar1 = FUN_8001796c();
      uVar2 = 1;
      if (iVar1 == 0) break;
      VSync(0);
    }
  }
  return uVar2;
}


/* 80018890 */

void FUN_80018890(undefined4 param_1)

{
  FUN_800185d4();
  FUN_800198e0(0x5a7,0x27750,0x3cc00,3,0x4c00,0xa000,0x4c00,0x1800,param_1);
  return;
}


/* 800188f0 */

undefined4 FUN_800188f0(int param_1,int param_2,undefined4 param_3)

{
  undefined4 uVar1;
  
  uVar1 = 0;
  if (DAT_800891ec == 0) {
    uVar1 = FUN_800198e0((uint)*(ushort *)(&UNK_80065408 + param_1 * 2) + param_2,0x64350,0xc000,4,
                         0xec00,0x1400,0x6400,0x80,param_3);
  }
  return uVar1;
}


/* 80018968 */

undefined4 FUN_80018968(int param_1,short param_2)

{
  int iVar1;
  undefined4 uVar2;
  undefined4 uStack00000018;
  
  uStack00000018 = 1;
  iVar1 = FUN_80018300(0x6400,4,0,param_1);
  if (iVar1 == 0) {
    uVar2 = 0;
  }
  else {
    FUN_80018468(param_1,0xdc);
    uVar2 = FUN_80019b9c((int)(short)(&DAT_800891c8)[param_1 * 2],0xff,(int)param_2);
  }
  return uVar2;
}


/* 80018c00 */

void FUN_80018c00(void)

{
  FUN_800185d4();
  FUN_80019878(0x5a6,0x27750,0x10800,3,0x4c00,0x5c00,0x4c00,0xc00);
  return;
}


/* 80018c58 */

void FUN_80018c58(undefined4 param_1)

{
  FUN_800185d4();
  FUN_800198e0(0x5a6,0x27750,0x10800,3,0x4c00,0x5c00,0x4c00,0xc00,param_1);
  return;
}


/* 80018190 */

undefined4 FUN_80018190(undefined1 param_1,undefined1 param_2,undefined2 param_3,undefined4 param_4)

{
  undefined4 uVar1;
  
  if ((short)(&DAT_8006d798)[DAT_8006d79c] < 0) {
    uVar1 = 0;
  }
  else {
    uVar1 = FUN_800199fc(0,param_1,param_2,param_3,param_4,0);
  }
  return uVar1;
}


/* 8001f4b8 */

undefined4 FUN_8001f4b8(undefined1 param_1,int *param_2)

{
  int iVar1;
  
  if ((param_2 != (int *)0x0) && (iVar1 = FUN_8001fc20(param_1), -1 < iVar1)) {
    if ((*param_2 != 0x30515350) && (*param_2 != 0x31515350)) {
      return 0;
    }
    if (*(ushort *)(param_2 + 1) < 0x201) {
      *(int *)(&DAT_800a1728 + iVar1 * 4) = *param_2;
      memcpy(&UNK_800a1748 + iVar1 * 0x200,(uchar *)param_2,(uint)*(ushort *)(param_2 + 1));
      return 1;
    }
  }
  return 0;
}


/* 8001f568 */

undefined4 FUN_8001f568(undefined1 param_1)

{
  undefined1 uVar1;
  int iVar2;
  undefined4 uVar3;
  int iVar4;
  int iVar5;
  
  iVar2 = func_0x8001f474(param_1);
  uVar3 = 0;
  if (iVar2 != 0) {
    iVar2 = FUN_8001fc20(param_1);
    iVar5 = 0;
    if (iVar2 < 0) {
      uVar3 = 0;
    }
    else {
      iVar4 = 0;
      do {
        memset(&DAT_800a1608 + iVar2 * 0x20 + iVar4,'\0',0x10);
        iVar5 = iVar5 + 1;
        iVar4 = iVar5 * 0x10;
      } while (iVar5 < 2);
      iVar5 = iVar2 * 0x200;
      if (*(int *)(&UNK_800a1750 + iVar5) == -1) {
        (&DAT_800a160c)[iVar2 * 0x10] = 0;
      }
      else {
        *(undefined **)(&DAT_800a1608 + iVar2 * 0x20) =
             &UNK_800a1748 + iVar2 * 0x200 + *(int *)(&UNK_800a1750 + iVar5);
        (&DAT_800a160c)[iVar2 * 0x10] = 1;
      }
      if (*(int *)(&UNK_800a1754 + iVar5) == -1) {
        (&DAT_800a161c)[iVar2 * 0x10] = 0;
      }
      else {
        *(undefined **)(&UNK_800a1618 + iVar2 * 0x20) =
             &UNK_800a1748 + iVar2 * 0x200 + *(int *)(&UNK_800a1754 + iVar5);
        (&DAT_800a161c)[iVar2 * 0x10] = 1;
      }
      uVar1 = FUN_8002fd50(param_1);
      (&DAT_8006d7b8)[iVar2] = uVar1;
      uVar3 = 1;
    }
  }
  return uVar3;
}


/* 8001f770 */

ushort FUN_8001f770(undefined1 param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  ushort uVar4;
  
  uVar4 = 0;
  iVar1 = FUN_8001fc20(param_1);
  iVar3 = 0;
  if (iVar1 < 0) {
    uVar4 = 0;
  }
  else {
    iVar2 = 0;
    do {
      uVar4 = uVar4 | *(ushort *)((int)&DAT_800a160c + iVar2 + iVar1 * 0x20);
      iVar3 = iVar3 + 1;
      iVar2 = iVar3 * 0x10;
    } while (iVar3 < 2);
  }
  return uVar4;
}


