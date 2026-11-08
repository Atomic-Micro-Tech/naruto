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


/* 8001fe10 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4
FUN_8001fe10(int param_1,int param_2,undefined2 *param_3,short *param_4,undefined1 param_5)

{
  short sVar1;
  short sVar2;
  short sVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  ushort pri;
  int iVar7;
  int iVar8;
  undefined2 *puVar9;
  short *psVar10;
  int in_t0;
  int iVar11;
  int in_t1;
  int in_t2;
  int in_t3;
  int in_t4;
  int iVar12;
  int iVar13;
  int unaff_s1;
  int unaff_s3;
  int iVar14;
  short unaff_s4;
  int *unaff_s5;
  short unaff_s6;
  undefined1 uStack00000012;
  undefined2 uStack00000030;
  undefined2 uStack00000032;
  undefined4 uStack00000038;
  short sStack0000003c;
  short sStack0000003e;
  short sStack00000040;
  short sStack00000042;
  short sStack00000044;
  short sStack00000046;
  undefined4 uStack00000048;
  short sStack0000004c;
  short sStack0000004e;
  short sStack00000050;
  short sStack00000052;
  short sStack00000054;
  short sStack00000056;
  undefined1 uStack00000058;
  undefined1 uStack0000005c;
  undefined1 uStack0000005d;
  undefined1 uStack0000005e;
  byte bStack0000005f;
  short sStack00000060;
  short sStack00000062;
  char cStack00000064;
  char cStack00000065;
  ushort uStack00000066;
  short sStack00000068;
  short sStack0000006a;
  char cStack0000006c;
  char cStack0000006d;
  short sStack00000070;
  short sStack00000072;
  char cStack00000074;
  char cStack00000075;
  short sStack00000078;
  short sStack0000007a;
  char cStack0000007c;
  char cStack0000007d;
  GsSPRITE GStack00000080;
  int in_stack_000000a8;
  GsOT *in_stack_000000e4;
  undefined4 in_stack_000000e8;
  
  while( true ) {
    *param_3 = (short)(param_1 + param_2 * unaff_s1 >> 0xc);
    *param_4 = (short)(*param_4 * 0x23f >> 9);
    unaff_s3 = unaff_s3 + 1;
    iVar7 = unaff_s3 * 4;
    if (7 < unaff_s3) break;
    param_4 = (short *)(in_t2 + iVar7);
    sVar1 = *(short *)(iVar7 + in_t4);
    param_2 = (int)*(short *)(iVar7 + in_t3);
    *param_4 = (short)(sVar1 * unaff_s1 - param_2 * in_t1 >> 0xc);
    param_3 = (undefined2 *)(in_t0 + iVar7);
    param_1 = sVar1 * in_t1;
  }
  uStack00000030 = 0;
  uStack00000032 = 0;
  iVar13 = in_stack_000000a8 << 1;
  iVar7 = rcos(iVar13);
  iVar13 = rsin(iVar13);
  iVar14 = 0;
  iVar8 = 0;
  do {
    psVar10 = (short *)((int)&uStack00000038 + iVar8);
    sVar1 = *(short *)(&UNK_800656e8 + iVar8);
    sVar2 = *(short *)(&UNK_800656ea + iVar8);
    *psVar10 = (short)(sVar1 * iVar7 - sVar2 * iVar13 >> 0xc);
    *(short *)((int)&uStack00000038 + iVar8 + 2) = (short)(sVar1 * iVar13 + sVar2 * iVar7 >> 0xc);
    *psVar10 = (short)(*psVar10 * 0x23f >> 9);
    iVar14 = iVar14 + 1;
    iVar8 = iVar14 * 4;
  } while (iVar14 < 4);
  GStack00000080.attribute = 0;
  GStack00000080.r = 0x80;
  GStack00000080.g = 0x80;
  GStack00000080.b = 0x80;
  GStack00000080.scalex = 0x1000;
  GStack00000080.scaley = 0x1000;
  iVar7 = VSync(-1);
  GStack00000080.u = '\0';
  GStack00000080.v = 0x98;
  GStack00000080.w = 0x38;
  GStack00000080.h = 0x10;
  GStack00000080.my = 8;
  GStack00000080.tpage = 0x15;
  GStack00000080.cx = 0xb0;
  GStack00000080.cy = 0x1fe;
  if (unaff_s5[0xe] == 1) {
    GStack00000080.attribute = GStack00000080.attribute | 0x800000;
    GStack00000080.mx = 8;
    GStack00000080.x = unaff_s4 + -0x8c;
  }
  else {
    GStack00000080.mx = 0x30;
    GStack00000080.x = unaff_s4 + 0x8c;
  }
  GStack00000080.rotate = (iVar7 % 5) * 0x2000 + -0xa000;
  if (*unaff_s5 == 0) {
    GStack00000080.rotate = 0;
  }
  GsSortSprite(&GStack00000080,in_stack_000000e4,(ushort)in_stack_000000e8);
  iVar13 = 0;
  iVar7 = in_stack_000000a8;
  do {
    iVar8 = func_0x80020dac();
    if ((0xb - iVar13 == iVar8) && ((*unaff_s5 != 1 || (unaff_s5[0x10] == 0x1000)))) {
      bStack0000005f = bStack0000005f & 0xfd;
      uStack0000005c = 0x80;
    }
    else {
      bStack0000005f = bStack0000005f | 2;
      uStack0000005c = (undefined1)((uint)unaff_s5[0x10] >> 5);
    }
    uStack0000005e = uStack0000005c;
    uStack0000005d = uStack0000005c;
    if (unaff_s5[0xe] == 1) {
      iVar8 = rcos(iVar7);
      iVar8 = -iVar8;
      iVar14 = rsin(iVar7);
      iVar14 = -iVar14;
    }
    else {
      iVar8 = rcos(iVar7);
      iVar14 = rsin(iVar7);
    }
    iVar11 = 0;
    iVar12 = unaff_s5[0xe];
    iVar4 = 0;
    do {
      puVar9 = (undefined2 *)((int)&uStack00000048 + iVar4);
      if (iVar12 == 1) {
        iVar4 = iVar4 + 0x10;
      }
      iVar5 = iVar11 * 4;
      if (unaff_s5[0xe] == 1) {
        iVar5 = iVar5 + 0x10;
      }
      *puVar9 = (short)(*(short *)(&UNK_80065668 + iVar4) * iVar8 -
                        *(short *)(&UNK_8006566a + iVar5) * iVar14 >> 0xc);
      iVar5 = iVar11 * 4;
      *(short *)(&uStack00000048 + iVar11) =
           (short)(*(short *)(&uStack00000048 + iVar11) * 0x23f >> 9);
      iVar4 = iVar5 + 2;
      if (unaff_s5[0xe] == 1) {
        iVar5 = iVar5 + 0x10;
      }
      iVar6 = iVar11 * 4;
      if (unaff_s5[0xe] == 1) {
        iVar6 = iVar6 + 0x10;
      }
      *(short *)((int)&uStack00000048 + iVar4) =
           (short)(*(short *)(&UNK_80065668 + iVar5) * iVar14 +
                   *(short *)(&UNK_8006566a + iVar6) * iVar8 >> 0xc);
      iVar11 = iVar11 + 1;
      iVar4 = iVar11 * 4;
    } while (iVar11 < 4);
    sStack00000060 = unaff_s4 + (short)uStack00000048;
    sStack00000062 = unaff_s6 + uStack00000048._2_2_;
    sStack00000068 = unaff_s4 + sStack0000004c;
    sStack0000006a = unaff_s6 + sStack0000004e;
    sStack00000070 = unaff_s4 + sStack00000050;
    sStack00000072 = unaff_s6 + sStack00000052;
    sStack00000078 = unaff_s4 + sStack00000054;
    sStack0000007a = unaff_s6 + sStack00000056;
    iVar8 = unaff_s5[0xc - iVar13] * 4;
    uStack00000066 =
         (*(short *)(&UNK_80065626 + iVar8) + 0x1fe) * 0x40 |
         *(ushort *)(&UNK_80065624 + iVar8) >> 4 & 0x3f;
    cStack00000064 = (&UNK_800655f0)[iVar8];
    cStack00000065 = (&UNK_800655f1)[iVar8];
    cStack0000006c = cStack00000064 + -1 + (&UNK_800655f2)[iVar8];
    cStack00000075 = cStack00000065 + -1 + (&UNK_800655f3)[iVar8];
    cStack0000007c = cStack0000006c;
    cStack0000006d = cStack00000065;
    cStack00000074 = cStack00000064;
    cStack0000007d = cStack00000075;
    GsSortPoly(&uStack00000058,in_stack_000000e4,(ushort)in_stack_000000e8);
    iVar13 = iVar13 + 1;
    iVar7 = iVar7 + 0x155;
  } while (iVar13 < 0xc);
  bStack0000005f = bStack0000005f & 0xfd;
  sVar1 = unaff_s4 + (short)unaff_s5[0xf];
  uStack0000005c = 0x80;
  uStack0000005d = 0x80;
  uStack0000005e = 0x80;
  uStack00000066 = 0x7fc9;
  cStack00000064 = 0;
  cStack00000065 = 0x60;
  cStack0000006c = 0x37;
  cStack0000006d = 0x60;
  cStack00000074 = 0;
  cStack00000075 = 0x97;
  cStack0000007c = 0x37;
  cStack0000007d = 0x97;
  sStack00000060 = sVar1 + (short)uStack00000038;
  sStack00000062 = unaff_s6 + uStack00000038._2_2_;
  sStack00000068 = sVar1 + sStack0000003c;
  sStack0000006a = unaff_s6 + sStack0000003e;
  sStack00000070 = sVar1 + sStack00000040;
  sStack00000072 = unaff_s6 + sStack00000042;
  sStack00000078 = sVar1 + sStack00000044;
  sStack0000007a = unaff_s6 + sStack00000046;
  pri = (ushort)in_stack_000000e8;
  GsSortPoly(&uStack00000058,in_stack_000000e4,pri);
  sStack00000060 = sVar1 + (short)(_UNK_800656e8 * 0x23f >> 9);
  sStack00000062 = unaff_s6 + _UNK_800656ea;
  sStack00000068 = sVar1 + (short)(_UNK_800656ec * 0x23f >> 9);
  sStack0000006a = unaff_s6 + _UNK_800656ee;
  sStack00000070 = sVar1 + (short)(_UNK_800656f0 * 0x23f >> 9);
  sStack00000072 = unaff_s6 + _UNK_800656f2;
  sStack00000078 = sVar1 + (short)(_UNK_800656f4 * 0x23f >> 9);
  sStack0000007a = unaff_s6 + _UNK_800656f6;
  uStack00000066 = 0x7fc9;
  cStack00000064 = 0xa0;
  cStack00000065 = 0;
  cStack0000006c = 0xd7;
  cStack0000006d = 0;
  cStack00000074 = 0xa0;
  cStack00000075 = 0x37;
  cStack0000007c = 0xd7;
  cStack0000007d = 0x37;
  GsSortPoly(&uStack00000058,in_stack_000000e4,pri);
  sVar1 = sVar1 - (short)unaff_s5[0xf];
  uStack00000066 = 0x7f90;
  cStack00000064 = 0x98;
  cStack00000065 = 0xca;
  cStack0000006c = 0xff;
  cStack0000006d = 0xca;
  cStack00000074 = 0x98;
  cStack00000075 = 0xcf;
  cStack0000007c = 0xff;
  cStack0000007d = 0xcf;
  iVar7 = in_stack_000000a8 + 0xaa;
  iVar13 = 0;
  do {
    if (unaff_s5[0xe] == 1) {
      iVar8 = rcos(iVar7);
      iVar8 = -iVar8;
      iVar14 = rsin(iVar7);
      iVar14 = -iVar14;
    }
    else {
      iVar8 = rcos(iVar7);
      iVar14 = rsin(iVar7);
    }
    iVar11 = 0;
    iVar12 = unaff_s5[0xe];
    iVar4 = 0;
    do {
      puVar9 = (undefined2 *)((int)&uStack00000048 + iVar4);
      if (iVar12 == 1) {
        iVar4 = iVar4 + 0x10;
      }
      iVar5 = iVar11 * 4;
      if (unaff_s5[0xe] == 1) {
        iVar5 = iVar5 + 0x10;
      }
      *puVar9 = (short)(*(short *)(&UNK_80065688 + iVar4) * iVar8 -
                        *(short *)(&UNK_8006568a + iVar5) * iVar14 >> 0xc);
      iVar5 = iVar11 * 4;
      *(short *)(&uStack00000048 + iVar11) =
           (short)(*(short *)(&uStack00000048 + iVar11) * 0x23f >> 9);
      iVar4 = iVar5 + 2;
      if (unaff_s5[0xe] == 1) {
        iVar5 = iVar5 + 0x10;
      }
      iVar6 = iVar11 * 4;
      if (unaff_s5[0xe] == 1) {
        iVar6 = iVar6 + 0x10;
      }
      *(short *)((int)&uStack00000048 + iVar4) =
           (short)(*(short *)(&UNK_80065688 + iVar5) * iVar14 +
                   *(short *)(&UNK_8006568a + iVar6) * iVar8 >> 0xc);
      iVar11 = iVar11 + 1;
      iVar4 = iVar11 * 4;
    } while (iVar11 < 4);
    sStack00000060 = sVar1 + (short)uStack00000048;
    sStack00000062 = unaff_s6 + uStack00000048._2_2_;
    sStack00000068 = sVar1 + sStack0000004c;
    sStack0000006a = unaff_s6 + sStack0000004e;
    sStack00000070 = sVar1 + sStack00000050;
    sStack00000072 = unaff_s6 + sStack00000052;
    sStack00000078 = sVar1 + sStack00000054;
    sStack0000007a = unaff_s6 + sStack00000056;
    GsSortPoly(&uStack00000058,in_stack_000000e4,(ushort)in_stack_000000e8);
    iVar13 = iVar13 + 1;
    iVar7 = iVar7 + 0x155;
  } while (iVar13 < 0xc);
  uStack00000066 = 0x7f8c;
  cStack00000064 = 0x38;
  cStack00000065 = 0x60;
  cStack0000006c = 0x43;
  cStack0000006d = 0x60;
  cStack00000074 = 0x38;
  cStack00000075 = 0x97;
  cStack0000007c = 0x43;
  cStack0000007d = 0x97;
  iVar13 = 0;
  iVar7 = in_stack_000000a8;
  do {
    if (unaff_s5[0xe] == 1) {
      iVar8 = rcos(iVar7);
      iVar8 = -iVar8;
      iVar14 = rsin(iVar7);
      iVar14 = -iVar14;
    }
    else {
      iVar8 = rcos(iVar7);
      iVar14 = rsin(iVar7);
    }
    iVar4 = 0;
    do {
      iVar11 = iVar4 * 4;
      sVar2 = *(short *)(&UNK_800656f8 + iVar11);
      sVar3 = *(short *)(&UNK_800656fa + iVar11);
      *(short *)(&uStack00000048 + iVar4) =
           (short)(((sVar2 * iVar8 - sVar3 * iVar14) * 0x10 >> 0x10) * 0x23f >> 9);
      iVar4 = iVar4 + 1;
      *(short *)((int)&uStack00000048 + iVar11 + 2) = (short)(sVar2 * iVar14 + sVar3 * iVar8 >> 0xc)
      ;
    } while (iVar4 < 4);
    sStack00000060 = sVar1 + (short)uStack00000048;
    sStack00000062 = unaff_s6 + uStack00000048._2_2_;
    sStack00000068 = sVar1 + sStack0000004c;
    sStack0000006a = unaff_s6 + sStack0000004e;
    sStack00000070 = sVar1 + sStack00000050;
    sStack00000072 = unaff_s6 + sStack00000052;
    sStack00000078 = sVar1 + sStack00000054;
    sStack0000007a = unaff_s6 + sStack00000056;
    GsSortPoly(&uStack00000058,in_stack_000000e4,(ushort)in_stack_000000e8);
    iVar13 = iVar13 + 1;
    iVar7 = iVar7 + 0x155;
  } while (iVar13 < 0xc);
  iVar7 = 0;
  do {
    iVar13 = iVar7 * 4;
    uStack00000066 =
         (*(short *)(&UNK_800656da + iVar13) + 0x1fe) * 0x40 |
         *(ushort *)(&UNK_800656d8 + iVar13) >> 4 & 0x3f;
    cStack00000064 = (&UNK_800656c8)[iVar13];
    cStack00000065 = (&UNK_800656c9)[iVar13];
    cStack0000006c = cStack00000064 + -1 + (&UNK_800656ca)[iVar13];
    cStack0000006d = cStack00000065;
    cStack00000074 = cStack00000064;
    cStack00000075 = cStack00000065 + -1 + (&UNK_800656cb)[iVar13];
    cStack0000007c = cStack0000006c;
    cStack0000007d = cStack00000075;
    sStack00000060 = sVar1 + *(short *)(&param_5 + (uint)(byte)(&UNK_80065658)[iVar13] * 4);
    sStack00000062 =
         unaff_s6 + *(short *)(&uStack00000012 + (uint)(byte)(&UNK_80065658)[iVar13] * 4);
    sStack00000068 = sVar1 + *(short *)(&param_5 + (uint)(byte)(&UNK_80065659)[iVar13] * 4);
    sStack0000006a =
         unaff_s6 + *(short *)(&uStack00000012 + (uint)(byte)(&UNK_80065659)[iVar13] * 4);
    sStack00000070 = sVar1 + *(short *)(&param_5 + (uint)(byte)(&UNK_8006565a)[iVar13] * 4);
    sStack00000072 =
         unaff_s6 + *(short *)(&uStack00000012 + (uint)(byte)(&UNK_8006565a)[iVar13] * 4);
    sStack00000078 = sVar1 + *(short *)(&param_5 + (uint)(byte)(&UNK_8006565b)[iVar13] * 4);
    sStack0000007a =
         unaff_s6 + *(short *)(&uStack00000012 + (uint)(byte)(&UNK_8006565b)[iVar13] * 4);
    GsSortPoly(&uStack00000058,in_stack_000000e4,(ushort)in_stack_000000e8);
    iVar7 = iVar7 + 1;
  } while (iVar7 < 4);
  return 1;
}


/* 8001a98c */

void FUN_8001a98c(void)

{
  FUN_8001a9cc();
  return;
}


/* 8001aad4 */

bool FUN_8001aad4(int param_1)

{
  if (param_1 != 0) {
    FUN_8001ab60();
    FUN_8001abc0(param_1,0,0);
    FUN_8001abec(param_1,0,0);
    FUN_8001ac10(param_1,3);
    FUN_8001ac7c(param_1,0);
    FUN_8001ac5c(param_1,0xffffffff);
    FUN_8001ad7c(param_1,0);
    FUN_8001ad64(param_1);
  }
  return param_1 != 0;
}


/* 8001ad94 */

undefined4 FUN_8001ad94(undefined4 param_1)

{
  int iVar1;
  
  iVar1 = 0;
  do {
    func_0x8001add8(param_1);
    iVar1 = iVar1 + 1;
  } while (iVar1 < 2);
  return 1;
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


/* 8001b364 */

void FUN_8001b364(void)

{
  func_0x8001b39c();
  return;
}


/* 8001b6c8 */

void FUN_8001b6c8(void)

{
  func_0x8001b720();
  return;
}


/* 8001c4a4 */

undefined4
FUN_8001c4a4(uint param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4,
            undefined4 param_5,undefined4 param_6,int param_7,undefined4 param_8)

{
  undefined4 uVar1;
  
  if (0xb < param_1) {
    return 0;
  }
  if (param_7 == 0) {
switchD_8001c4fc_default:
    uVar1 = 0;
  }
  else {
    switch(param_1) {
    case 0:
      uVar1 = FUN_8001c7f8();
      break;
    case 1:
    case 2:
      uVar1 = FUN_8001c7f8();
      break;
    case 4:
    case 3:
      uVar1 = FUN_8001cbfc();
      break;
    case 5:
      uVar1 = FUN_8001d148();
      break;
    case 6:
      uVar1 = FUN_8001cf9c();
      break;
    case 7:
      uVar1 = FUN_8001d3a8();
      break;
    case 8:
      uVar1 = FUN_8001d494();
      break;
    case 9:
      uVar1 = FUN_8001d688();
      break;
    case 10:
      uVar1 = FUN_8001d9c8();
      break;
    case 0xb:
      uVar1 = FUN_8001dcb0(param_2,param_3,param_4,param_5,param_6,param_7,param_8);
      break;
    default:
      goto switchD_8001c4fc_default;
    }
  }
  return uVar1;
}


/* 80022ed4 */

undefined4 FUN_80022ed4(short param_1,short param_2,uint param_3,GsOT *param_4,int param_5)

{
  short sVar1;
  int iVar2;
  short sVar3;
  short sVar4;
  GsSPRITE GStack_48;
  
  if (3 < param_3) {
    return 0;
  }
  if (param_4 == (GsOT *)0x0) {
    return 0;
  }
  sVar3 = 0;
  if (param_5 == 0) {
    return 0;
  }
  GStack_48.attribute = 0;
  GStack_48.r = 0x80;
  GStack_48.g = 0x80;
  GStack_48.b = 0x80;
  iVar2 = param_3 * 4;
  GStack_48.u = (&UNK_8006575c)[iVar2];
  GStack_48.v = (&UNK_8006575d)[iVar2];
  GStack_48.w = (ushort)(byte)(&UNK_8006575e)[iVar2];
  GStack_48.h = (ushort)(byte)(&UNK_8006575f)[iVar2];
  sVar4 = 0;
  if (param_3 == 1) {
    sVar4 = 1;
    sVar3 = 0;
  }
  else if (param_3 == 0) {
    sVar4 = -1;
    sVar3 = 0;
  }
  else if (param_3 == 2) {
    sVar3 = -1;
    sVar4 = 0;
  }
  else if (param_3 == 3) {
    sVar3 = 1;
    sVar4 = 0;
  }
  GStack_48.rotate = 0;
  GStack_48.mx = (short)((byte)(&UNK_8006575e)[param_3 * 4] >> 1);
  GStack_48.my = (short)((byte)(&UNK_8006575f)[param_3 * 4] >> 1);
  GStack_48.scalex = 0x1000;
  GStack_48.scaley = 0x1000;
  GStack_48.cx = 0x10;
  GStack_48.cy = 0x1ff;
  GStack_48.tpage = 0x15;
  iVar2 = VSync(-1);
  iVar2 = rsin((iVar2 * 0x1000) / 0x1e);
  if (iVar2 < 0) {
    iVar2 = iVar2 + 0x7ff;
  }
  sVar1 = (short)(iVar2 >> 0xb);
  GStack_48.x = param_1 + sVar3 * sVar1;
  GStack_48.y = param_2 + sVar4 * sVar1;
  GsSortSprite(&GStack_48,param_4,(ushort)param_5);
  return 1;
}


/* 80023320 */

undefined4 FUN_80023320(short param_1,short param_2,uint param_3,GsOT *param_4,undefined4 param_5)

{
  int iVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  GsSPRITE GStack_68;
  int aiStack_40 [4];
  int iStack_30;
  
  iStack_30 = (int)param_2;
  iVar4 = 0;
  iVar5 = 0;
  iVar3 = 0;
  iVar1 = 0;
  do {
    if ((param_3 & *(uint *)(&UNK_8006578c + iVar1)) != 0) {
      aiStack_40[iVar4] = iVar3;
      iVar5 = iVar5 + 0x10 + (uint)(byte)(&UNK_8006576e)[iVar1];
      iVar4 = iVar4 + 1;
    }
    iVar3 = iVar3 + 1;
    iVar1 = iVar3 * 4;
  } while (iVar3 < 4);
  GStack_68.attribute = 0;
  GStack_68.r = 0x80;
  GStack_68.g = 0x80;
  GStack_68.b = 0x80;
  GStack_68.mx = 0;
  GStack_68.my = 0;
  GStack_68.scalex = 0x1000;
  GStack_68.scaley = 0x1000;
  GStack_68.tpage = 0x15;
  GStack_68.y = (short)iStack_30;
  GStack_68.x = (param_1 - (short)iVar5) + -0x10;
  iVar1 = 0;
  if (0 < iVar4) {
    do {
      piVar2 = aiStack_40 + iVar1;
      FUN_80022ccc((int)GStack_68.x,(int)GStack_68.y,*(undefined4 *)(&UNK_8006579c + *piVar2 * 4),1,
                   param_4,param_5);
      GStack_68.x = GStack_68.x + 0x10;
      GStack_68.cx = *(short *)(&UNK_8006577c + *piVar2 * 4);
      GStack_68.cy = *(short *)(&UNK_8006577e + *piVar2 * 4) + 0x1fe;
      GStack_68.u = (&UNK_8006576c)[*piVar2 * 4];
      GStack_68.v = (&UNK_8006576d)[*piVar2 * 4];
      GStack_68.w = (ushort)(byte)(&UNK_8006576e)[*piVar2 * 4];
      GStack_68.h = (ushort)(byte)(&UNK_8006576f)[*piVar2 * 4];
      GsSortFastSprite(&GStack_68,param_4,(ushort)param_5);
      GStack_68.x = (ushort)(byte)(&UNK_8006576e)[*piVar2 * 4] + GStack_68.x;
      iVar1 = iVar1 + 1;
    } while (iVar1 < iVar4);
  }
  func_0x800230d0(((param_1 - iVar5) + -0x20) * 0x10000 >> 0x10,iStack_30,
                  (iVar5 + 0x20) * 0x10000 >> 0x10,param_4,param_5);
  return 1;
}


/* 800221e0 */

undefined4 FUN_800221e0(uchar *param_1,int param_2)

{
  undefined4 uVar1;
  
  if ((param_1 == (uchar *)0x0) || (param_2 == 0)) {
    uVar1 = 0;
  }
  else {
    memset(param_1,'\0',0x54);
    param_1[0] = '\x0f';
    param_1[1] = '\0';
    param_1[2] = '\0';
    param_1[3] = 0xf0;
    *(int *)(param_1 + 0xc) = param_2;
    FUN_80022548(param_1,0);
    func_0x80022510(param_1,0x10);
    func_0x80022640(param_1,0x80,0x80,0x80);
    func_0x80022684(param_1,0x1000);
    func_0x800226e8(param_1,0,0);
    func_0x80022304(param_1,0,0);
    uVar1 = 1;
  }
  return uVar1;
}


/* 80022548 */

undefined4 FUN_80022548(int *param_1,undefined4 param_2)

{
  undefined2 uVar1;
  int iVar2;
  int iVar3;
  undefined2 *puVar4;
  
  if (param_1 != (int *)0x0) {
    if (*param_1 != -0xffffff1) {
      return 0;
    }
    iVar2 = FUN_8001e50c(0,param_1[3]);
    if ((iVar2 != 0) && (iVar2 = FUN_8001e50c(param_2,iVar2), iVar2 != 0)) {
      iVar3 = FUN_8001e50c(0,iVar2);
      param_1[0x11] = iVar3;
      if (iVar2 != 0) {
        iVar3 = FUN_8001e50c(1,iVar2);
        param_1[0x12] = iVar3;
        if (iVar2 != 0) {
          *(short *)((int)param_1 + 0x2a) = (short)param_2;
          *(undefined2 *)((int)param_1 + 0x26) = 0x4000;
          *(undefined2 *)(param_1 + 10) = 0;
          param_1[0xf] = 0;
          *(undefined2 *)((int)param_1 + 0x2e) = 0;
          uVar1 = FUN_8001e3e0(param_1[0x11]);
          *(undefined2 *)(param_1 + 0xb) = uVar1;
          puVar4 = (undefined2 *)FUN_8001e50c(*(undefined2 *)((int)param_1 + 0x2e),param_1[0x11]);
          param_1[0x13] = (int)puVar4;
          iVar2 = FUN_8001e50c(*puVar4,param_1[0x12]);
          param_1[0x14] = iVar2;
          return 1;
        }
      }
    }
  }
  return 0;
}


/* 800227f0 */

undefined4 FUN_800227f0(int *param_1,short param_2,short param_3,GsOT *param_4,ushort param_5)

{
  undefined4 uVar1;
  ushort *puVar2;
  int iVar3;
  GsSPRITE GStack_48;
  
  if ((param_1 == (int *)0x0) || (*param_1 != -0xffffff1)) {
    uVar1 = 0;
  }
  else {
    GStack_48.r = *(uchar *)((int)param_1 + 0x22);
    GStack_48.g = *(uchar *)((int)param_1 + 0x23);
    GStack_48.b = (uchar)param_1[9];
    puVar2 = (ushort *)param_1[0x14];
    iVar3 = 0;
    if (*puVar2 != 0) {
      do {
        puVar2 = puVar2 + ((uint)*puVar2 - iVar3) * 10 + -8;
        GStack_48.attribute =
             (puVar2[3] >> 7 & 3) << 0x18 | (puVar2[3] >> 5 & 3) << 0x1c |
             (uint)(puVar2[2] >> 0xf) << 0x1e | param_1[0xe] & 0xffffffbfU;
        GStack_48.scalex = (puVar2[8] - 0x1000) + (short)param_1[0xc];
        GStack_48.scaley = (puVar2[9] - 0x1000) + *(short *)((int)param_1 + 0x32);
        GStack_48.mx = puVar2[4] >> 1;
        GStack_48.my = puVar2[5] >> 1;
        GStack_48.rotate = (uint)puVar2[6] * 0x168 + param_1[0xd];
        GStack_48.u = (char)*puVar2 + (char)param_1[8];
        GStack_48.v = *(char *)((int)puVar2 + 1) + *(char *)((int)param_1 + 0x21);
        GStack_48.w = puVar2[4];
        GStack_48.h = puVar2[5];
        GStack_48.tpage = *(ushort *)((int)param_1 + (uint)(puVar2[7] >> 0xe) * 2 + 0x14);
        GStack_48.cx = (short)param_1[7];
        GStack_48.cy = *(short *)((int)param_1 + 0x1e);
        GStack_48.x = param_2 + *(short *)(param_1[0x13] + 4) + ((byte)puVar2[1] - 0x7f) +
                      GStack_48.mx;
        GStack_48.y = param_3 + *(short *)(param_1[0x13] + 6) + (*(byte *)((int)puVar2 + 3) - 0x7f)
                      + GStack_48.my;
        GsSortSprite(&GStack_48,param_4,param_5);
        iVar3 = iVar3 + 1;
        puVar2 = (ushort *)param_1[0x14];
      } while (iVar3 < (int)(uint)*puVar2);
    }
    uVar1 = 1;
  }
  return uVar1;
}


