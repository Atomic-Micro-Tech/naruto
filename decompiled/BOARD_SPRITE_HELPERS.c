/* 8001a648 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_8001a648(undefined1 param_1,uint param_2,undefined4 param_3)

{
  int iVar1;
  int iVar2;
  
  iVar2 = (param_2 & 0xff) + 0x2a9;
  iVar1 = FUN_8002dbb8(iVar2);
  if ((-1 < iVar1) && (_UNK_8006d6b8 = FUN_8002df30(iVar1), _UNK_8006d6b8 != 0)) {
    iVar1 = FUN_8002d838(iVar2,_UNK_8006d6b8,iVar1,&UNK_8001a770,param_1);
    if (iVar1 != 0) {
      _UNK_8006d6bc = param_3;
      return 1;
    }
    FUN_8002dfe4(_UNK_8006d6b8);
    _UNK_8006d6b8 = 0;
  }
  return 0;
}


/* 8001a764 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool FUN_8001a764(void)

{
  return _UNK_8006d6b8 != 0;
}


/* 8001a7a0 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_8001a7a0(void)

{
  undefined4 uVar1;
  int iVar2;
  undefined2 in_v1;
  short unaff_s0;
  undefined4 uStack00000010;
  undefined2 uStack00000014;
  undefined2 uStack00000016;
  undefined2 uStack00000018;
  short sStack0000001a;
  undefined2 uStack0000001c;
  undefined2 uStack0000001e;
  
  sStack0000001a = unaff_s0 + 0xf5;
  uStack0000001c = in_v1;
  uStack0000001e = in_v1;
  uVar1 = FUN_8001e50c(0,_UNK_8006d6b8);
  iVar2 = FUN_8001eca4(uVar1,&uStack00000010,&uStack00000018);
  if (iVar2 != 0) {
    uStack00000010._0_2_ = unaff_s0 * 0x80 + 0x180;
    uStack00000010._2_2_ = 0;
    uStack00000014 = 0xffff;
    uStack00000016 = 0xffff;
    uStack00000018 = 0x400;
    sStack0000001a = 0x400;
    uStack0000001c = 0x400;
    uStack0000001e = 0x400;
    uVar1 = FUN_8001e50c(1,_UNK_8006d6b8);
    iVar2 = FUN_8001eca4(uVar1,&uStack00000010,&uStack00000018);
    if (iVar2 != 0) {
      DrawSync(0);
      FUN_8002dfe4(_UNK_8006d6b8);
      _UNK_8006d6b8 = 0;
      if (_UNK_8006d6bc != (code *)0x0) {
        (*_UNK_8006d6bc)();
      }
      return 1;
    }
  }
  FUN_8002dfe4(_UNK_8006d6b8);
  return 0;
}


/* 80022aa8 */

undefined4 FUN_80022aa8(int *param_1)

{
  bool bVar1;
  undefined2 *puVar2;
  int iVar3;
  uint uVar4;
  
  if (param_1 != (int *)0x0) {
    if (*param_1 != -0xffffff1) {
      return 0;
    }
    if ((*(ushort *)((int)param_1 + 0x26) & 0x4000) == 0) {
      iVar3 = param_1[0xf];
      param_1[0xf] = iVar3 + 0x10U;
      uVar4 = (uint)*(byte *)(param_1[0x13] + 2) * param_1[0x10];
      if (iVar3 + 0x10U <= uVar4) {
        return 1;
      }
      if ((*(ushort *)((int)param_1 + 0x26) & 0x2000) == 0) {
        bVar1 = true;
        if (*(ushort *)((int)param_1 + 0x2e) + 1 < (uint)*(ushort *)(param_1 + 0xb)) {
          *(short *)((int)param_1 + 0x2e) = *(short *)((int)param_1 + 0x2e) + 1;
        }
        else if ((*(ushort *)((int)param_1 + 0x26) & 0x8000) == 0) {
          if ((short)param_1[10] == 0) {
            *(ushort *)((int)param_1 + 0x26) = *(ushort *)((int)param_1 + 0x26) | 0x4000;
            bVar1 = false;
            if ((code *)param_1[4] != (code *)0x0) {
              (*(code *)param_1[4])(param_1);
            }
          }
          else {
            *(short *)(param_1 + 10) = (short)param_1[10] + -1;
            *(undefined2 *)((int)param_1 + 0x2e) = 0;
          }
        }
        else {
          *(undefined2 *)((int)param_1 + 0x2e) = 0;
        }
        if (bVar1) {
          puVar2 = (undefined2 *)FUN_8001e50c(*(undefined2 *)((int)param_1 + 0x2e),param_1[0x11]);
          param_1[0x13] = (int)puVar2;
          iVar3 = FUN_8001e50c(*puVar2,param_1[0x12]);
          param_1[0x14] = iVar3;
        }
      }
      if (uVar4 == 0) {
        uVar4 = 1;
      }
      if (uVar4 == 0) {
        trap(7);
      }
      param_1[0xf] = (uint)param_1[0xf] % uVar4;
      return 1;
    }
  }
  return 0;
}


/* 80022510 */

undefined4 FUN_80022510(int *param_1,int param_2)

{
  if ((param_1 == (int *)0x0) || (param_2 == 0)) {
    return 0;
  }
  if (*param_1 == -0xffffff1) {
    param_1[0x10] = param_2;
    return 1;
  }
  return 0;
}


/* 80022774 */

undefined4 FUN_80022774(int *param_1,undefined2 param_2,short param_3)

{
  if ((param_1 == (int *)0x0) || (*param_1 != -0xffffff1)) {
    return 0;
  }
  *(undefined2 *)((int)param_1 + 0x26) = param_2;
  *(short *)(param_1 + 10) = param_3;
  *(undefined2 *)((int)param_1 + 0x2e) = 0;
  if (param_3 != 0) {
    *(short *)(param_1 + 10) = param_3 + -1;
  }
  return 1;
}


