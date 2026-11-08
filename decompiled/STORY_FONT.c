/* 8001ac98 */

undefined2 FUN_8001ac98(int param_1)

{
  undefined2 uVar1;
  
  uVar1 = 0;
  if (param_1 != 0) {
    uVar1 = *(undefined2 *)(param_1 + 0x24);
  }
  return uVar1;
}


/* 8001ace4 */

undefined4 FUN_8001ace4(int param_1)

{
  undefined2 uVar1;
  undefined4 uVar2;
  
  if ((param_1 == 0) || (*(short *)(param_1 + 0x24) != 1)) {
    uVar2 = 0;
  }
  else {
    *(undefined2 *)(param_1 + 0x24) = 0;
    uVar1 = func_0x80016f48();
    *(undefined2 *)(param_1 + 0x30) = uVar1;
    uVar2 = 1;
  }
  return uVar2;
}


/* 8001ad94 */

undefined4 FUN_8001ad94(undefined4 param_1)

{
  int iVar1;
  
  iVar1 = 0;
  do {
    FUN_8001add8(param_1);
    iVar1 = iVar1 + 1;
  } while (iVar1 < 2);
  return 1;
}


/* 8001add8 */

undefined4 FUN_8001add8(undefined4 *param_1)

{
  ushort uVar1;
  short sVar2;
  undefined4 uVar3;
  int iVar4;
  uint uVar5;
  
  uVar3 = 0;
  if (param_1 != (undefined4 *)0x0) {
    iVar4 = FUN_8001ac98(param_1);
    uVar3 = 1;
    if (iVar4 != 4) {
      iVar4 = func_0x8001ad50(param_1);
      uVar3 = 0;
      if (iVar4 == 0) {
        iVar4 = func_0x8001c414(*param_1);
        uVar1 = *(ushort *)(param_1 + 9);
        if (uVar1 != 1) {
          if (uVar1 < 2) {
            if (uVar1 != 0) {
              return 1;
            }
            *(short *)(param_1 + 0xc) = *(short *)(param_1 + 0xc) + 1;
            uVar1 = func_0x80016f48();
            if (*(ushort *)(param_1 + 0xc) < uVar1) {
              return 1;
            }
            *(undefined2 *)(param_1 + 0xc) = 0;
            uVar1 = *(short *)((int)param_1 + 0x22) + 1;
            *(ushort *)((int)param_1 + 0x22) = uVar1;
            if (uVar1 < *(ushort *)(param_1 + 5)) {
              uVar1 = *(ushort *)((uint)*(ushort *)((int)param_1 + 0x22) * 2 + iVar4) & 0xf000;
              if (uVar1 == 0x3000) {
                uVar1 = *(short *)((int)param_1 + 0x22) + 1;
                *(ushort *)((int)param_1 + 0x22) = uVar1;
                *(undefined2 *)(param_1 + 0xc) = *(undefined2 *)((uint)uVar1 * 2 + iVar4);
                *(undefined2 *)(param_1 + 9) = 2;
              }
              else if (uVar1 < 0x3001) {
                if (uVar1 != 0x1000) {
                  if (uVar1 < 0x1001) {
                    return 1;
                  }
                  if (uVar1 != 0x2000) {
                    return 1;
                  }
                  uVar1 = *(short *)((int)param_1 + 0x2e) + 1;
                  *(ushort *)((int)param_1 + 0x2e) = uVar1;
                  if (uVar1 < *(ushort *)((int)param_1 + 0x1a)) {
                    return 1;
                  }
                  *(undefined2 *)(param_1 + 9) = 3;
                  *(undefined2 *)((int)param_1 + 0x2a) = 0;
                  *(undefined2 *)(param_1 + 0xb) = 1;
                }
              }
              else if (uVar1 == 0xb000) {
                *(undefined1 *)((int)param_1 + 0x36) = 1;
                if ((code *)param_1[1] != (code *)0x0) {
                  (*(code *)param_1[1])(0);
                  return 1;
                }
              }
              else {
                if (0xb000 < uVar1) {
                  return 1;
                }
                if (uVar1 != 0x4000) {
                  return 1;
                }
                *(undefined2 *)(param_1 + 9) = 1;
              }
            }
            else {
              *(undefined2 *)(param_1 + 9) = 4;
            }
          }
          else if (uVar1 == 2) {
            if (*(short *)(param_1 + 0xc) == 0) {
              *(undefined2 *)(param_1 + 9) = 0;
            }
            else {
              *(short *)(param_1 + 0xc) = *(short *)(param_1 + 0xc) + -1;
            }
          }
          else {
            if (uVar1 != 3) {
              return 1;
            }
            uVar5 = (uint)*(ushort *)(param_1 + 0xb);
            if ((uint)*(ushort *)((int)param_1 + 0x2a) < uVar5 << 3) {
              if (uVar5 == 0) {
                trap(7);
              }
              *(short *)(param_1 + 10) =
                   (short)((int)((uint)*(ushort *)((int)param_1 + 0x2a) * uVar5 * 0x10) /
                          (int)(uVar5 << 3));
              *(short *)((int)param_1 + 0x2a) = *(short *)((int)param_1 + 0x2a) + 1;
            }
            else {
              *(undefined2 *)(param_1 + 9) = 0;
              *(undefined2 *)(param_1 + 10) = 0;
              sVar2 = func_0x8001ba88(*param_1,0,0x2000,*(short *)((int)param_1 + 0x2e) + -2);
              *(short *)(param_1 + 8) = sVar2 + 1;
            }
          }
        }
        uVar3 = 1;
      }
    }
  }
  return uVar3;
}


/* 8001b0b4 */

undefined4 FUN_8001b0b4(undefined4 *param_1,GsOT *param_2,undefined4 param_3)

{
  undefined4 uVar1;
  undefined4 uVar2;
  DRAWENV *pDVar3;
  int iVar4;
  RECT RStack_68;
  DR_ENV DStack_60;
  
  if (param_1 != (undefined4 *)0x0) {
    FUN_8001b2b8(param_1[2]);
    FUN_8001b2dc(param_1[3]);
    uVar1 = FUN_8001b2d0();
    FUN_8001b2c4(*(undefined2 *)((int)param_1 + 0x32));
    uVar2 = FUN_8001b2f4();
    FUN_8001b2e8((int)*(short *)(param_1 + 0xd));
    if (*(short *)(param_1 + 9) == 3) {
      RStack_68.x = 0;
      RStack_68.y = 0;
      RStack_68.w = (short)DAT_800ab330;
      RStack_68.h = (short)DAT_800ab334;
      pDVar3 = GsSetClip2(&RStack_68);
      SetDrawEnv(&DStack_60,pDVar3);
      GsSortPoly(&DStack_60,param_2,(ushort)param_3);
    }
    iVar4 = FUN_8001a9cc((int)*(short *)(param_1 + 4) - (int)*(short *)((int)param_1 + 0x26),
                         (int)*(short *)((int)param_1 + 0x12) - (int)*(short *)(param_1 + 10),
                         *param_1,*(undefined2 *)((int)param_1 + 0x16),*(undefined2 *)(param_1 + 6),
                         *(undefined2 *)(param_1 + 8),
                         (uint)*(ushort *)((int)param_1 + 0x22) - (uint)*(ushort *)(param_1 + 8),
                         param_2,param_3);
    if (iVar4 != 0) {
      if (*(short *)(param_1 + 9) == 3) {
        RStack_68.x = 0;
        RStack_68.y = *(short *)((int)param_1 + 0x12);
        RStack_68.w = (short)DAT_800ab330;
        RStack_68.h = (short)DAT_800ab334 - RStack_68.y;
        iVar4 = func_0x8001f0e4(&RStack_68);
        if (iVar4 != 0) {
          pDVar3 = GsSetClip2(&RStack_68);
          SetDrawEnv(&DStack_60,pDVar3);
          GsSortPoly(&DStack_60,param_2,(ushort)param_3);
        }
      }
      FUN_8001b2c4(uVar1);
      FUN_8001b2e8(uVar2);
      *(undefined2 *)(param_1 + 7) = DAT_8006d7b4;
      *(undefined2 *)((int)param_1 + 0x1e) = DAT_8006d7b6;
      return 1;
    }
  }
  return 0;
}


