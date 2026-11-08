/* 80015c6c */

int FUN_80015c6c(undefined4 param_1)

{
  int iVar1;
  int iVar2;
  
  iVar1 = func_0x800161e8(param_1,1);
  if (iVar1 < 0) {
    iVar1 = -1;
  }
  else {
    iVar2 = func_0x800161e8(param_1,0x21);
    if (0 < iVar2) {
      iVar1 = iVar1 + -1;
    }
  }
  return iVar1;
}


/* 80015cc8 */

int FUN_80015cc8(undefined4 param_1)

{
  int iVar1;
  int iVar2;
  
  iVar1 = func_0x800161e8(param_1,2);
  if (iVar1 < 0) {
    iVar1 = -1;
  }
  else {
    iVar2 = func_0x800161e8(param_1,0x22);
    if (0 < iVar2) {
      iVar1 = iVar1 + -1;
    }
  }
  return iVar1;
}


/* 80015d24 */

undefined4 FUN_80015d24(uint param_1,uint param_2,undefined4 *param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  if (param_1 < 0xd) {
    if (4 < param_2) {
      return 0;
    }
    if (param_3 == (undefined4 *)0x0) {
      return 0;
    }
    iVar1 = func_0x800160fc(param_1,0,0x21);
    iVar3 = param_2 + 1;
    if (param_2 == 4) {
      iVar2 = iVar1;
      if (-1 < iVar1) {
LAB_80015da8:
        iVar1 = iVar2 * 0x1c + param_1 * 0x118;
        *param_3 = *(undefined4 *)(&UNK_8005693c + iVar1);
        param_3[1] = *(undefined4 *)(&UNK_80056940 + iVar1);
        param_3[2] = *(undefined4 *)(&UNK_80056944 + iVar1);
        param_3[3] = *(undefined4 *)(&UNK_80056948 + iVar1);
        param_3[4] = *(undefined4 *)(&UNK_8005694c + iVar1);
        param_3[5] = *(undefined4 *)(&UNK_80056950 + iVar1);
        param_3[6] = *(undefined4 *)(&UNK_80056954 + iVar1);
        return 1;
      }
    }
    else {
      iVar2 = 0;
      do {
        iVar2 = func_0x800160fc(param_1,iVar2,1);
        if (((-1 < iVar2) && (iVar3 == 1)) && (iVar2 != iVar1)) goto LAB_80015da8;
        iVar3 = iVar3 + -1;
        iVar2 = iVar2 + 1;
      } while (iVar3 != 0);
    }
  }
  return 0;
}


/* 80015e84 */

undefined4 FUN_80015e84(uint param_1,uint param_2,undefined4 *param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  if (param_1 < 0xd) {
    if (4 < param_2) {
      return 0;
    }
    if (param_3 == (undefined4 *)0x0) {
      return 0;
    }
    iVar1 = func_0x800160fc(param_1,0,0x22);
    iVar3 = param_2 + 1;
    if (param_2 == 4) {
      iVar2 = iVar1;
      if (-1 < iVar1) {
LAB_80015f08:
        iVar1 = iVar2 * 0x1c + param_1 * 0x118;
        *param_3 = *(undefined4 *)(&UNK_8005693c + iVar1);
        param_3[1] = *(undefined4 *)(&UNK_80056940 + iVar1);
        param_3[2] = *(undefined4 *)(&UNK_80056944 + iVar1);
        param_3[3] = *(undefined4 *)(&UNK_80056948 + iVar1);
        param_3[4] = *(undefined4 *)(&UNK_8005694c + iVar1);
        param_3[5] = *(undefined4 *)(&UNK_80056950 + iVar1);
        param_3[6] = *(undefined4 *)(&UNK_80056954 + iVar1);
        return 1;
      }
    }
    else {
      iVar2 = 0;
      do {
        iVar2 = func_0x800160fc(param_1,iVar2,2);
        if (((-1 < iVar2) && (iVar3 == 1)) && (iVar2 != iVar1)) goto LAB_80015f08;
        iVar3 = iVar3 + -1;
        iVar2 = iVar2 + 1;
      } while (iVar3 != 0);
    }
  }
  return 0;
}


/* 80012bd4 */

undefined1 FUN_80012bd4(uint param_1,uint param_2)

{
  if ((param_1 < 0x12) && (param_2 < 0xc)) {
    return (&DAT_80070cf6)[param_2];
  }
  return 0;
}


/* 80019f74 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_80019f74(undefined4 *param_1)

{
  if (param_1 == (undefined4 *)0x0) {
    return 0;
  }
  _DAT_80089d60 = *param_1;
  _UNK_80089d64 = param_1[1];
  _UNK_80089d68 = param_1[2];
  _UNK_80089d6c = param_1[3];
  _UNK_80089d70 = param_1[4];
  _UNK_80089d74 = param_1[5];
  _UNK_80089d78 = param_1[6];
  return 1;
}


/* 80019fe8 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_80019fe8(undefined4 *param_1)

{
  if (param_1 == (undefined4 *)0x0) {
    return 0;
  }
  _UNK_80089d7c = *param_1;
  _UNK_80089d80 = param_1[1];
  _UNK_80089d84 = param_1[2];
  _UNK_80089d88 = param_1[3];
  _UNK_80089d8c = param_1[4];
  _UNK_80089d90 = param_1[5];
  _UNK_80089d94 = param_1[6];
  return 1;
}


/* 8001a138 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_8001a138(undefined4 *param_1)

{
  if (param_1 == (undefined4 *)0x0) {
    return 0;
  }
  _UNK_80089d98 = *param_1;
  return 1;
}


/* 8001a058 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_8001a058(undefined4 *param_1)

{
  if (param_1 == (undefined4 *)0x0) {
    return 0;
  }
  *param_1 = _DAT_80089d60;
  param_1[1] = _UNK_80089d64;
  param_1[2] = _UNK_80089d68;
  param_1[3] = _UNK_80089d6c;
  param_1[4] = _UNK_80089d70;
  param_1[5] = _UNK_80089d74;
  param_1[6] = _UNK_80089d78;
  return 1;
}


/* 8001a0c8 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_8001a0c8(undefined4 *param_1)

{
  if (param_1 == (undefined4 *)0x0) {
    return 0;
  }
  *param_1 = _UNK_80089d7c;
  param_1[1] = _UNK_80089d80;
  param_1[2] = _UNK_80089d84;
  param_1[3] = _UNK_80089d88;
  param_1[4] = _UNK_80089d8c;
  param_1[5] = _UNK_80089d90;
  param_1[6] = _UNK_80089d94;
  return 1;
}


