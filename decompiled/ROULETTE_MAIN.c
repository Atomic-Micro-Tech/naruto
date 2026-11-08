/* 8001fc60 */

undefined4 FUN_8001fc60(undefined4 *param_1)

{
  if (param_1 == (undefined4 *)0x0) {
    return 0;
  }
  *param_1 = 0;
  param_1[0xd] = 0;
  param_1[0xf] = 0;
  return 1;
}


/* 8001fc80 */

undefined4 FUN_8001fc80(int *param_1)

{
  int iVar1;
  
  if (param_1 == (int *)0x0) {
    return 0;
  }
  if (*param_1 == 1) {
    param_1[0xd] = param_1[0xd] + 0xb4U & 0xfff;
  }
  iVar1 = param_1[0xf];
  if (iVar1 != 0) {
    if (iVar1 < 0) {
      iVar1 = iVar1 + 1;
    }
    else {
      iVar1 = iVar1 + -1;
    }
    param_1[0xf] = iVar1;
    param_1[0xf] = -param_1[0xf];
  }
  return 1;
}


/* 8001fcf4 */

undefined4 FUN_8001fcf4(int param_1,undefined4 param_2)

{
  if (param_1 == 0) {
    return 0;
  }
  *(undefined4 *)(param_1 + 0x38) = param_2;
  return 1;
}


/* 80020bf4 */

undefined4 FUN_80020bf4(int *param_1)

{
  undefined4 uVar1;
  int iVar2;
  int iVar3;
  
  if ((param_1 == (int *)0x0) || (*param_1 == 1)) {
    uVar1 = 0;
  }
  else {
    *param_1 = 1;
    iVar2 = rand();
    iVar3 = iVar2;
    if (iVar2 < 0) {
      iVar3 = iVar2 + 0xfff;
    }
    param_1[0xd] = iVar2 + (iVar3 >> 0xc) * -0x1000;
    func_0x80020d48(param_1,0x1000);
    FUN_80018300(0x4800,2,3,0,0);
    FUN_80018468(0,0xb4);
    uVar1 = 1;
  }
  return uVar1;
}


/* 80020c90 */

undefined4 FUN_80020c90(int *param_1)

{
  undefined4 uVar1;
  
  uVar1 = 0;
  if (param_1 != (int *)0x0) {
    if (*param_1 == 0) {
      uVar1 = 0;
    }
    else {
      *param_1 = 0;
      param_1[0xd] = ((uint)param_1[0xd] / 0x155) * 0x155;
      FUN_80018568(0);
      uVar1 = 1;
    }
  }
  return uVar1;
}


/* 80020d1c */

undefined4 FUN_80020d1c(int param_1,undefined4 param_2)

{
  if (param_1 == 0) {
    return 0;
  }
  *(undefined4 *)(param_1 + 0x3c) = param_2;
  return 1;
}


/* 80020dac */

uint FUN_80020dac(int param_1)

{
  if (param_1 == 0) {
    return 0;
  }
  return ((*(uint *)(param_1 + 0x34) & 0xfff) / 0x155) % 0xc;
}


/* 80020d48 */

undefined4 FUN_80020d48(int param_1,uint param_2)

{
  if (param_1 == 0) {
    return 0;
  }
  if (0x1000 < param_2) {
    param_2 = 0x1000;
  }
  *(uint *)(param_1 + 0x40) = param_2;
  return 1;
}


/* 80020d70 */

undefined4 FUN_80020d70(int param_1)

{
  undefined4 uVar1;
  int iVar2;
  
  uVar1 = 0;
  if (param_1 != 0) {
    iVar2 = FUN_80020dac();
    uVar1 = *(undefined4 *)(param_1 + iVar2 * 4 + 4);
  }
  return uVar1;
}


/* 80020e10 */

undefined4 FUN_80020e10(int param_1,uint param_2,uint param_3)

{
  if (((param_1 == 0) || (0xb < param_2)) || (0xc < param_3)) {
    return 0;
  }
  *(uint *)(param_1 + param_2 * 4 + 4) = param_3;
  return 1;
}


/* 80020e40 */

int FUN_80020e40(int param_1,int param_2)

{
  int iVar1;
  uint uVar2;
  int iVar3;
  
  if (param_1 != 0) {
    iVar3 = 0;
    if (*(int *)(param_1 + 4) != param_2) {
      iVar1 = 1;
      do {
        iVar3 = iVar1;
        if (0xb < iVar3) {
          return -1;
        }
        iVar1 = iVar3 + 1;
      } while (*(int *)(param_1 + 4 + iVar3 * 4) != param_2);
    }
    if (iVar3 < 0xc) {
      uVar2 = iVar3 * 0x155;
      if (uVar2 < *(uint *)(param_1 + 0x34)) {
        uVar2 = uVar2 + 0x1000;
      }
      return (int)(uVar2 - *(int *)(param_1 + 0x34)) / 0xb4;
    }
  }
  return -1;
}


/* 80021178 */

undefined4 FUN_80021178(int param_1,undefined4 param_2)

{
  if (param_1 == 0) {
    return 0;
  }
  *(undefined4 *)(param_1 + 0x20) = param_2;
  return 1;
}


/* 8002128c */

undefined4 FUN_8002128c(int param_1,undefined2 param_2,undefined2 param_3,int param_4)

{
  if ((param_1 == 0) || (param_4 == 0)) {
    return 0;
  }
  *(code **)(param_1 + 4) = gte_ldrgb;
  *(undefined2 *)(param_1 + 0x30) = param_2;
  *(undefined2 *)(param_1 + 0x32) = param_3;
  *(undefined2 *)(param_1 + 0x34) = *(undefined2 *)(param_1 + 0xc);
  *(undefined2 *)(param_1 + 0x36) = *(undefined2 *)(param_1 + 0xe);
  *(int *)(param_1 + 0x28) = param_4;
  *(undefined4 *)(param_1 + 0x2c) = 0;
  return 1;
}


