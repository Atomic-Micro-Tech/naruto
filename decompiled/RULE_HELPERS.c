/* 800139fc */

uint FUN_800139fc(uint param_1,uint param_2)

{
  if ((param_1 < 4) && (param_2 < 3)) {
    return (uint)*(byte *)((int)&DAT_80070ea8 + param_2 + param_1 * 0xb4 + 2);
  }
  return 0xffffffff;
}


/* 80013a48 */

undefined4 FUN_80013a48(uint param_1,byte param_2)

{
  byte bVar1;
  uint uVar2;
  int iVar3;
  byte *pbVar4;
  int iVar5;
  
  if (param_1 < 4) {
    uVar2 = func_0x800154d4();
    iVar5 = 0;
    if (uVar2 <= param_2) {
      return 0;
    }
    iVar3 = param_1 * 0xb4;
    do {
      pbVar4 = (byte *)((int)&DAT_80070ea8 + iVar3 + 2);
      bVar1 = *pbVar4;
      uVar2 = func_0x800154d4();
      iVar5 = iVar5 + 1;
      if (uVar2 <= bVar1) {
        *pbVar4 = param_2;
        return 1;
      }
      iVar3 = iVar5 + param_1 * 0xb4;
    } while (iVar5 < 3);
  }
  return 0;
}


/* 80013b10 */

undefined4 FUN_80013b10(uint param_1,uint param_2)

{
  undefined1 uVar1;
  undefined4 uVar2;
  
  if ((param_1 < 4) && (param_2 < 3)) {
    uVar1 = FUN_800139fc(param_1,param_2);
    FUN_80015adc(0,uVar1);
    if ((int)param_2 < 2) {
      do {
        *(undefined1 *)((int)&DAT_80070ea8 + param_2 + param_1 * 0xb4 + 2) =
             *(undefined1 *)((int)&DAT_80070ea8 + param_2 + param_1 * 0xb4 + 3);
        param_2 = param_2 + 1;
      } while ((int)param_2 < 2);
    }
    *(undefined1 *)(&DAT_80070eac + param_1 * 0x2d) = 0xff;
    uVar2 = 1;
  }
  else {
    uVar2 = 0;
  }
  return uVar2;
}


/* 80013bf0 */

undefined4 FUN_80013bf0(uint param_1)

{
  undefined4 uVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  
  if (param_1 < 4) {
    uVar1 = 1;
    iVar4 = 0;
    do {
      uVar2 = FUN_800139fc(param_1,iVar4);
      uVar3 = func_0x800154d4();
      if (uVar3 <= uVar2) {
        uVar1 = 0;
      }
      iVar4 = iVar4 + 1;
    } while (iVar4 < 3);
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 80015274 */

undefined4 FUN_80015274(uint param_1,uint param_2,undefined1 param_3)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 4)) {
    (&UNK_80070f2e)[(param_2 & 0xff) + (param_1 & 0xff) * 0xb4] = param_3;
    return 1;
  }
  return 0;
}


/* 800152c8 */

undefined1 FUN_800152c8(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 4) && ((param_2 & 0xff) < 4)) {
    return (&UNK_80070f2e)[(param_2 & 0xff) + (param_1 & 0xff) * 0xb4];
  }
  return 0;
}


/* 800154e0 */

undefined4 FUN_800154e0(uint param_1)

{
  uint uVar1;
  undefined4 uVar2;
  
  uVar1 = func_0x800154d4();
  if (param_1 < uVar1) {
    uVar2 = (&DAT_80055cec)[param_1 * 4];
  }
  else {
    uVar2 = 0xffffffff;
  }
  return uVar2;
}


/* 8001552c */

undefined4 FUN_8001552c(uint param_1)

{
  uint uVar1;
  undefined4 uVar2;
  
  uVar1 = func_0x800154d4();
  if (param_1 < uVar1) {
    uVar2 = *(undefined4 *)(&UNK_80055cf4 + param_1 * 0x10);
  }
  else {
    uVar2 = 0;
  }
  return uVar2;
}


/* 80015578 */

undefined4 FUN_80015578(uint param_1)

{
  uint uVar1;
  undefined4 uVar2;
  
  uVar1 = func_0x800154d4();
  if (param_1 < uVar1) {
    uVar2 = *(undefined4 *)(&UNK_80055cf0 + param_1 * 0x10);
  }
  else {
    uVar2 = 0xffffffff;
  }
  return uVar2;
}


/* 800155c4 */

undefined4 FUN_800155c4(uint param_1)

{
  uint uVar1;
  undefined4 uVar2;
  
  uVar1 = func_0x800154d4();
  if (param_1 < uVar1) {
    uVar2 = *(undefined4 *)(&UNK_80055cf8 + param_1 * 0x10);
  }
  else {
    uVar2 = 0xffffffff;
  }
  return uVar2;
}


/* 80015610 */

undefined4 FUN_80015610(uint param_1)

{
  undefined4 uVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  
  if (param_1 < 0x12) {
    uVar3 = 0;
    iVar2 = 0;
    do {
      uVar4 = 0;
      if ((&DAT_8005603c)[param_1 * 0x40 + (iVar2 + uVar3) * 0x80] != -1) {
        iVar2 = uVar3 * 0x40;
        do {
          (&DAT_80070d0a)[iVar2] = (&DAT_8005603c)[uVar4 + param_1 * 0x40 + uVar3 * 0x480];
          uVar4 = uVar4 + 1 & 0xffff;
          if (0x3f < uVar4) break;
          iVar2 = uVar4 + uVar3 * 0x40;
        } while ((&DAT_8005603c)[uVar4 + param_1 * 0x40 + uVar3 * 0x480] != -1);
      }
      (&DAT_80070d02)[uVar3] = (short)uVar4;
      uVar3 = uVar3 + 1 & 0xffff;
      iVar2 = uVar3 << 3;
    } while (uVar3 < 2);
    uVar3 = 0;
    do {
      FUN_80015b7c(uVar3);
      (&DAT_80070d06)[uVar3] = 0;
      uVar3 = uVar3 + 1 & 0xffff;
      uVar1 = 1;
    } while (uVar3 < 2);
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 80015768 */

undefined1 FUN_80015768(void)

{
  undefined1 uVar1;
  
  uVar1 = DAT_80070d0a;
  FUN_800158e8(0,0);
  FUN_80015b7c(0);
  return uVar1;
}


/* 800157c4 */

undefined1 FUN_800157c4(void)

{
  return (&DAT_80070d0a)[DAT_80070d06];
}


/* 800157e4 */

void FUN_800157e4(undefined2 param_1)

{
  FUN_80015808(0,param_1);
  return;
}


/* 80015808 */

undefined1 FUN_80015808(undefined4 param_1,uint param_2)

{
  undefined1 uVar1;
  uint uVar2;
  
  uVar2 = func_0x800158d8(0);
  if ((param_2 & 0xffff) < (uVar2 & 0xffff)) {
    uVar1 = (&DAT_80070d0a)[param_2 & 0xffff];
  }
  else {
    uVar1 = 0xff;
  }
  return uVar1;
}


/* 800158e8 */

undefined4 FUN_800158e8(undefined4 param_1,uint param_2)

{
  uint uVar1;
  undefined4 uVar2;
  int iVar3;
  
  param_2 = param_2 & 0xffff;
  uVar1 = func_0x800158d8(0);
  if (param_2 < (uVar1 & 0xffff)) {
    for (; iVar3 = func_0x800158d8(0), (int)param_2 < iVar3 + -1; param_2 = param_2 + 1 & 0xffff) {
      (&DAT_80070d0a)[param_2] = (&DAT_80070d0b)[param_2];
    }
    DAT_80070d02 = DAT_80070d02 + -1;
    uVar2 = 1;
  }
  else {
    uVar2 = 0;
  }
  return uVar2;
}


/* 800159bc */

undefined4 FUN_800159bc(undefined4 param_1,uint param_2,byte param_3)

{
  uint uVar1;
  undefined4 uVar2;
  
  param_2 = param_2 & 0xffff;
  uVar1 = func_0x800158d8(0);
  uVar2 = 0;
  if (param_2 < (uVar1 & 0xffff)) {
    uVar1 = func_0x800154d4();
    if ((param_3 < uVar1) && (DAT_80070d02 < 0x40)) {
      DAT_80070d02 = DAT_80070d02 + 1;
      uVar1 = func_0x800158d8(0);
      while (uVar1 = uVar1 - 1 & 0xffff, param_2 < uVar1) {
        (&DAT_80070d0a)[uVar1] = *(undefined1 *)((int)&DAT_80070d08 + uVar1 + 1);
      }
      (&DAT_80070d0a)[param_2] = param_3;
      uVar2 = 1;
    }
    else {
      uVar2 = 0;
    }
  }
  return uVar2;
}


/* 80015adc */

undefined4 FUN_80015adc(undefined4 param_1,uint param_2)

{
  uint uVar1;
  undefined4 uVar2;
  int iVar3;
  uint uVar4;
  
  uVar1 = func_0x800154d4();
  uVar2 = 0;
  if ((param_2 & 0xff) < uVar1) {
    uVar1 = func_0x800158d8(param_1);
    iVar3 = rand();
    uVar4 = func_0x800158d8(param_1);
    uVar4 = uVar4 >> 1 & 0xff;
    if (uVar4 == 0) {
      trap(7);
    }
    uVar2 = FUN_800159bc(param_1,(uVar1 >> 1 & 0xff) + iVar3 % (int)uVar4 & 0xffff,param_2 & 0xff);
  }
  return uVar2;
}


/* 80015b7c */

undefined4 FUN_80015b7c(void)

{
  undefined1 uVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  uint uVar6;
  
  uVar6 = (uint)DAT_80070d02;
  iVar5 = 0;
  if (uVar6 != 0) {
    do {
      uVar2 = (uint)DAT_80070d02;
      if (uVar2 == 0) {
        trap(7);
      }
      iVar3 = rand();
      uVar4 = (uint)DAT_80070d02;
      if (uVar4 == 0) {
        trap(7);
      }
      uVar1 = (&DAT_80070d0a)[iVar5 % (int)uVar2];
      (&DAT_80070d0a)[iVar5 % (int)uVar2] = (&DAT_80070d0a)[iVar3 % (int)uVar4];
      iVar5 = iVar5 + 1;
      (&DAT_80070d0a)[iVar3 % (int)uVar4] = uVar1;
    } while (iVar5 < (int)(uVar6 << 2));
  }
  return 1;
}


/* 80016098 */

uint FUN_80016098(uint param_1)

{
  uint uVar1;
  
  if (param_1 < 0xd) {
    uVar1 = func_0x800160fc(param_1,0,0x40);
    uVar1 = ~uVar1 >> 0x1f;
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 800160d4 */

undefined1 FUN_800160d4(uint param_1)

{
  if (param_1 < 0xe) {
    return (&UNK_80057774)[param_1];
  }
  return 0;
}


