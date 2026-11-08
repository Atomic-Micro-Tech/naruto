/* 8001fd0c */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_8001fd0c(int *param_1,short param_2,short param_3,GsOT *param_4,ushort param_5)

{
  short sVar1;
  short sVar2;
  undefined4 uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  short *psVar9;
  int iVar10;
  int iVar11;
  int iVar12;
  int iVar13;
  short asStack_c8 [20];
  short asStack_a0 [16];
  undefined1 auStack_80 [3];
  undefined1 uStack_7d;
  undefined1 uStack_7c;
  undefined1 uStack_7b;
  undefined1 uStack_7a;
  byte bStack_79;
  short sStack_78;
  short sStack_76;
  char cStack_74;
  char cStack_73;
  ushort uStack_72;
  short sStack_70;
  short sStack_6e;
  char cStack_6c;
  char cStack_6b;
  undefined2 uStack_6a;
  short sStack_68;
  short sStack_66;
  char cStack_64;
  char cStack_63;
  short sStack_60;
  short sStack_5e;
  char cStack_5c;
  char cStack_5b;
  GsSPRITE GStack_58;
  int iStack_30;
  
  if (param_1 == (int *)0x0) {
    uVar3 = 0;
  }
  else {
    iStack_30 = param_1[0xd] + 0x155;
    uStack_7d = 9;
    bStack_79 = 0x2c;
    uStack_6a = 0x35;
    uStack_7c = 0x80;
    uStack_7b = 0x80;
    uStack_7a = 0x80;
    iVar12 = param_1[0xd] + 0x1ff;
    iVar4 = rcos(iVar12);
    iVar12 = rsin(iVar12);
    iVar13 = 0;
    iVar8 = 0;
    do {
      psVar9 = (short *)((int)asStack_c8 + iVar8);
      sVar1 = *(short *)(&UNK_800656a8 + iVar8);
      sVar2 = *(short *)(&UNK_800656aa + iVar8);
      *psVar9 = (short)(sVar1 * iVar4 - sVar2 * iVar12 >> 0xc);
      *(short *)((int)asStack_c8 + iVar8 + 2) = (short)(sVar1 * iVar12 + sVar2 * iVar4 >> 0xc);
      *psVar9 = (short)(*psVar9 * 0x23f >> 9);
      iVar13 = iVar13 + 1;
      iVar8 = iVar13 * 4;
    } while (iVar13 < 8);
    asStack_c8[0x10] = 0;
    asStack_c8[0x11] = 0;
    iVar12 = iStack_30 << 1;
    iVar4 = rcos(iVar12);
    iVar12 = rsin(iVar12);
    iVar13 = 0;
    iVar8 = 0;
    do {
      psVar9 = (short *)((int)asStack_a0 + iVar8);
      sVar1 = *(short *)(&UNK_800656e8 + iVar8);
      sVar2 = *(short *)(&UNK_800656ea + iVar8);
      *psVar9 = (short)(sVar1 * iVar4 - sVar2 * iVar12 >> 0xc);
      *(short *)((int)asStack_a0 + iVar8 + 2) = (short)(sVar1 * iVar12 + sVar2 * iVar4 >> 0xc);
      *psVar9 = (short)(*psVar9 * 0x23f >> 9);
      iVar13 = iVar13 + 1;
      iVar8 = iVar13 * 4;
    } while (iVar13 < 4);
    GStack_58.attribute = 0;
    GStack_58.r = 0x80;
    GStack_58.g = 0x80;
    GStack_58.b = 0x80;
    GStack_58.scalex = 0x1000;
    GStack_58.scaley = 0x1000;
    iVar4 = VSync(-1);
    GStack_58.u = '\0';
    GStack_58.v = 0x98;
    GStack_58.w = 0x38;
    GStack_58.h = 0x10;
    GStack_58.my = 8;
    GStack_58.tpage = 0x15;
    GStack_58.cx = 0xb0;
    GStack_58.cy = 0x1fe;
    if (param_1[0xe] == 1) {
      GStack_58.attribute = GStack_58.attribute | 0x800000;
      GStack_58.mx = 8;
      GStack_58.x = param_2 + -0x8c;
    }
    else {
      GStack_58.mx = 0x30;
      GStack_58.x = param_2 + 0x8c;
    }
    GStack_58.rotate = (iVar4 % 5) * 0x2000 + -0xa000;
    if (*param_1 == 0) {
      GStack_58.rotate = 0;
    }
    GStack_58.y = param_3;
    GsSortSprite(&GStack_58,param_4,param_5);
    iVar12 = 0;
    iVar4 = iStack_30;
    do {
      iVar8 = func_0x80020dac(param_1);
      if ((0xb - iVar12 == iVar8) && ((*param_1 != 1 || (param_1[0x10] == 0x1000)))) {
        bStack_79 = bStack_79 & 0xfd;
        uStack_7c = 0x80;
      }
      else {
        bStack_79 = bStack_79 | 2;
        uStack_7c = (undefined1)((uint)param_1[0x10] >> 5);
      }
      uStack_7b = uStack_7c;
      uStack_7a = uStack_7c;
      if (param_1[0xe] == 1) {
        iVar8 = rcos(iVar4);
        iVar8 = -iVar8;
        iVar13 = rsin(iVar4);
        iVar13 = -iVar13;
      }
      else {
        iVar8 = rcos(iVar4);
        iVar13 = rsin(iVar4);
      }
      iVar10 = 0;
      iVar11 = param_1[0xe];
      iVar5 = 0;
      do {
        iVar7 = iVar5 + 0x10;
        if (iVar11 == 1) {
          iVar5 = iVar5 + 0x10;
        }
        iVar6 = iVar10 * 4;
        if (param_1[0xe] == 1) {
          iVar6 = iVar6 + 0x10;
        }
        *(short *)((int)asStack_a0 + iVar7) =
             (short)(*(short *)(&UNK_80065668 + iVar5) * iVar8 -
                     *(short *)(&UNK_8006566a + iVar6) * iVar13 >> 0xc);
        iVar5 = iVar10 * 4;
        asStack_a0[iVar10 * 2 + 8] = (short)(asStack_a0[iVar10 * 2 + 8] * 0x23f >> 9);
        if (param_1[0xe] == 1) {
          iVar5 = iVar5 + 0x10;
        }
        iVar7 = iVar10 * 4;
        if (param_1[0xe] == 1) {
          iVar7 = iVar7 + 0x10;
        }
        asStack_a0[iVar10 * 2 + 9] =
             (short)(*(short *)(&UNK_80065668 + iVar5) * iVar13 +
                     *(short *)(&UNK_8006566a + iVar7) * iVar8 >> 0xc);
        iVar10 = iVar10 + 1;
        iVar5 = iVar10 * 4;
      } while (iVar10 < 4);
      sStack_78 = param_2 + asStack_a0[8];
      sStack_76 = param_3 + asStack_a0[9];
      sStack_70 = param_2 + asStack_a0[10];
      sStack_6e = param_3 + asStack_a0[0xb];
      sStack_68 = param_2 + asStack_a0[0xc];
      sStack_66 = param_3 + asStack_a0[0xd];
      sStack_60 = param_2 + asStack_a0[0xe];
      sStack_5e = param_3 + asStack_a0[0xf];
      iVar8 = param_1[0xc - iVar12] * 4;
      uStack_72 = (*(short *)(&UNK_80065626 + iVar8) + 0x1fe) * 0x40 |
                  *(ushort *)(&UNK_80065624 + iVar8) >> 4 & 0x3f;
      cStack_74 = (&UNK_800655f0)[iVar8];
      cStack_73 = (&UNK_800655f1)[iVar8];
      cStack_6c = cStack_74 + -1 + (&UNK_800655f2)[iVar8];
      cStack_63 = cStack_73 + -1 + (&UNK_800655f3)[iVar8];
      cStack_6b = cStack_73;
      cStack_64 = cStack_74;
      cStack_5c = cStack_6c;
      cStack_5b = cStack_63;
      GsSortPoly(auStack_80,param_4,param_5);
      iVar12 = iVar12 + 1;
      iVar4 = iVar4 + 0x155;
    } while (iVar12 < 0xc);
    bStack_79 = bStack_79 & 0xfd;
    param_2 = param_2 + (short)param_1[0xf];
    uStack_7c = 0x80;
    uStack_7b = 0x80;
    uStack_7a = 0x80;
    uStack_72 = 0x7fc9;
    cStack_74 = 0;
    cStack_73 = 0x60;
    cStack_6c = 0x37;
    cStack_6b = 0x60;
    cStack_64 = 0;
    cStack_63 = 0x97;
    cStack_5c = 0x37;
    cStack_5b = 0x97;
    sStack_78 = param_2 + asStack_a0[0];
    sStack_76 = param_3 + asStack_a0[1];
    sStack_70 = param_2 + asStack_a0[2];
    sStack_6e = param_3 + asStack_a0[3];
    sStack_68 = param_2 + asStack_a0[4];
    sStack_66 = param_3 + asStack_a0[5];
    sStack_60 = param_2 + asStack_a0[6];
    sStack_5e = param_3 + asStack_a0[7];
    GsSortPoly(auStack_80,param_4,param_5);
    sStack_78 = param_2 + (short)(_UNK_800656e8 * 0x23f >> 9);
    sStack_76 = param_3 + _UNK_800656ea;
    sStack_70 = param_2 + (short)(_UNK_800656ec * 0x23f >> 9);
    sStack_6e = param_3 + _UNK_800656ee;
    sStack_68 = param_2 + (short)(_UNK_800656f0 * 0x23f >> 9);
    sStack_66 = param_3 + _UNK_800656f2;
    sStack_60 = param_2 + (short)(_UNK_800656f4 * 0x23f >> 9);
    sStack_5e = param_3 + _UNK_800656f6;
    uStack_72 = 0x7fc9;
    cStack_74 = 0xa0;
    cStack_73 = 0;
    cStack_6c = 0xd7;
    cStack_6b = 0;
    cStack_64 = 0xa0;
    cStack_63 = 0x37;
    cStack_5c = 0xd7;
    cStack_5b = 0x37;
    GsSortPoly(auStack_80,param_4,param_5);
    param_2 = param_2 - (short)param_1[0xf];
    uStack_72 = 0x7f90;
    cStack_74 = 0x98;
    cStack_73 = 0xca;
    cStack_6c = 0xff;
    cStack_6b = 0xca;
    cStack_64 = 0x98;
    cStack_63 = 0xcf;
    cStack_5c = 0xff;
    cStack_5b = 0xcf;
    iVar4 = iStack_30 + 0xaa;
    iVar12 = 0;
    do {
      if (param_1[0xe] == 1) {
        iVar8 = rcos(iVar4);
        iVar8 = -iVar8;
        iVar13 = rsin(iVar4);
        iVar13 = -iVar13;
      }
      else {
        iVar8 = rcos(iVar4);
        iVar13 = rsin(iVar4);
      }
      iVar10 = 0;
      iVar11 = param_1[0xe];
      iVar5 = 0;
      do {
        iVar7 = iVar5 + 0x10;
        if (iVar11 == 1) {
          iVar5 = iVar5 + 0x10;
        }
        iVar6 = iVar10 * 4;
        if (param_1[0xe] == 1) {
          iVar6 = iVar6 + 0x10;
        }
        *(short *)((int)asStack_a0 + iVar7) =
             (short)(*(short *)(&UNK_80065688 + iVar5) * iVar8 -
                     *(short *)(&UNK_8006568a + iVar6) * iVar13 >> 0xc);
        iVar5 = iVar10 * 4;
        asStack_a0[iVar10 * 2 + 8] = (short)(asStack_a0[iVar10 * 2 + 8] * 0x23f >> 9);
        if (param_1[0xe] == 1) {
          iVar5 = iVar5 + 0x10;
        }
        iVar7 = iVar10 * 4;
        if (param_1[0xe] == 1) {
          iVar7 = iVar7 + 0x10;
        }
        asStack_a0[iVar10 * 2 + 9] =
             (short)(*(short *)(&UNK_80065688 + iVar5) * iVar13 +
                     *(short *)(&UNK_8006568a + iVar7) * iVar8 >> 0xc);
        iVar10 = iVar10 + 1;
        iVar5 = iVar10 * 4;
      } while (iVar10 < 4);
      sStack_78 = param_2 + asStack_a0[8];
      sStack_76 = param_3 + asStack_a0[9];
      sStack_70 = param_2 + asStack_a0[10];
      sStack_6e = param_3 + asStack_a0[0xb];
      sStack_68 = param_2 + asStack_a0[0xc];
      sStack_66 = param_3 + asStack_a0[0xd];
      sStack_60 = param_2 + asStack_a0[0xe];
      sStack_5e = param_3 + asStack_a0[0xf];
      GsSortPoly(auStack_80,param_4,param_5);
      iVar12 = iVar12 + 1;
      iVar4 = iVar4 + 0x155;
    } while (iVar12 < 0xc);
    uStack_72 = 0x7f8c;
    cStack_74 = 0x38;
    cStack_73 = 0x60;
    cStack_6c = 0x43;
    cStack_6b = 0x60;
    cStack_64 = 0x38;
    cStack_63 = 0x97;
    cStack_5c = 0x43;
    cStack_5b = 0x97;
    iVar12 = 0;
    iVar4 = iStack_30;
    do {
      if (param_1[0xe] == 1) {
        iVar8 = rcos(iVar4);
        iVar8 = -iVar8;
        iVar13 = rsin(iVar4);
        iVar13 = -iVar13;
      }
      else {
        iVar8 = rcos(iVar4);
        iVar13 = rsin(iVar4);
      }
      iVar5 = 0;
      do {
        sVar1 = *(short *)(&UNK_800656f8 + iVar5 * 4);
        sVar2 = *(short *)(&UNK_800656fa + iVar5 * 4);
        asStack_a0[iVar5 * 2 + 8] =
             (short)(((sVar1 * iVar8 - sVar2 * iVar13) * 0x10 >> 0x10) * 0x23f >> 9);
        iVar10 = iVar5 * 2;
        iVar5 = iVar5 + 1;
        asStack_a0[iVar10 + 9] = (short)(sVar1 * iVar13 + sVar2 * iVar8 >> 0xc);
      } while (iVar5 < 4);
      sStack_78 = param_2 + asStack_a0[8];
      sStack_76 = param_3 + asStack_a0[9];
      sStack_70 = param_2 + asStack_a0[10];
      sStack_6e = param_3 + asStack_a0[0xb];
      sStack_68 = param_2 + asStack_a0[0xc];
      sStack_66 = param_3 + asStack_a0[0xd];
      sStack_60 = param_2 + asStack_a0[0xe];
      sStack_5e = param_3 + asStack_a0[0xf];
      GsSortPoly(auStack_80,param_4,param_5);
      iVar12 = iVar12 + 1;
      iVar4 = iVar4 + 0x155;
    } while (iVar12 < 0xc);
    iVar4 = 0;
    do {
      iVar12 = iVar4 * 4;
      uStack_72 = (*(short *)(&UNK_800656da + iVar12) + 0x1fe) * 0x40 |
                  *(ushort *)(&UNK_800656d8 + iVar12) >> 4 & 0x3f;
      cStack_74 = (&UNK_800656c8)[iVar12];
      cStack_73 = (&UNK_800656c9)[iVar12];
      cStack_6c = cStack_74 + -1 + (&UNK_800656ca)[iVar12];
      cStack_6b = cStack_73;
      cStack_64 = cStack_74;
      cStack_63 = cStack_73 + -1 + (&UNK_800656cb)[iVar12];
      cStack_5c = cStack_6c;
      cStack_5b = cStack_63;
      sStack_78 = param_2 + asStack_c8[(uint)(byte)(&UNK_80065658)[iVar12] * 2];
      sStack_76 = param_3 + asStack_c8[(uint)(byte)(&UNK_80065658)[iVar12] * 2 + 1];
      sStack_70 = param_2 + asStack_c8[(uint)(byte)(&UNK_80065659)[iVar12] * 2];
      sStack_6e = param_3 + asStack_c8[(uint)(byte)(&UNK_80065659)[iVar12] * 2 + 1];
      sStack_68 = param_2 + asStack_c8[(uint)(byte)(&UNK_8006565a)[iVar12] * 2];
      sStack_66 = param_3 + asStack_c8[(uint)(byte)(&UNK_8006565a)[iVar12] * 2 + 1];
      sStack_60 = param_2 + asStack_c8[(uint)(byte)(&UNK_8006565b)[iVar12] * 2];
      sStack_5e = param_3 + asStack_c8[(uint)(byte)(&UNK_8006565b)[iVar12] * 2 + 1];
      GsSortPoly(auStack_80,param_4,param_5);
      iVar4 = iVar4 + 1;
      uVar3 = 1;
    } while (iVar4 < 4);
  }
  return uVar3;
}


/* 8001a9cc */

void FUN_8001a9cc(undefined4 param_1,undefined4 param_2,int param_3,undefined4 param_4,
                 undefined4 param_5,int param_6,int param_7,undefined4 param_8,undefined4 param_9)

{
  int iVar1;
  ushort *puVar2;
  uint uVar3;
  uint uVar4;
  
  iVar1 = FUN_8001a63c();
  puVar2 = (ushort *)(param_3 * 4 + iVar1 + 8);
  if (param_7 < 0) {
    uVar4 = (uint)puVar2[1];
  }
  else {
    uVar3 = (uint)*(ushort *)(param_3 * 4 + iVar1 + 8 + 2);
    uVar4 = param_7 + param_6;
    if ((int)uVar3 <= param_7 + param_6) {
      uVar4 = uVar3;
    }
  }
  FUN_8001bce8(param_1,param_2,
               iVar1 + (uint)*(ushort *)(iVar1 + 4) * 4 + 8 + (uint)*puVar2 * 2 + param_6 * 2,
               param_4,param_5,uVar4 - param_6,param_8,param_9);
  return;
}


/* 8001ab60 */

bool FUN_8001ab60(undefined4 *param_1,undefined4 param_2)

{
  undefined2 uVar1;
  
  if (param_1 != (undefined4 *)0x0) {
    *param_1 = param_2;
    uVar1 = FUN_8001ba58();
    *(undefined2 *)(param_1 + 5) = uVar1;
    *(undefined2 *)(param_1 + 10) = 0;
    *(undefined2 *)((int)param_1 + 0x26) = 0;
    *(undefined2 *)(param_1 + 0xc) = 0;
    *(undefined2 *)(param_1 + 9) = 0;
    *(undefined2 *)(param_1 + 8) = 0;
    *(undefined2 *)((int)param_1 + 0x22) = 0;
    *(undefined2 *)((int)param_1 + 0x2e) = 0;
    *(undefined1 *)((int)param_1 + 0x36) = 0;
  }
  return param_1 != (undefined4 *)0x0;
}


/* 8001b39c */

undefined4
FUN_8001b39c(short param_1,short param_2,int param_3,uint param_4,uint param_5,uchar *param_6,
            GsOT *param_7,ushort param_8)

{
  bool bVar1;
  byte bVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  GsSPRITE GStack_58;
  uint uStack_30;
  uint uStack_2c;
  
  if (param_4 != 0) {
    uVar5 = param_5 & 0xf;
    if ((uVar5 < 4) && ((param_5 & 0xf0) < 0x30)) {
      uStack_30 = (uint)((param_5 & 0x200) != 0);
      iVar3 = uVar5 * 2;
      bVar2 = (&UNK_800654f0)[iVar3];
      GStack_58.attribute = 0;
      GStack_58.w = (ushort)(byte)(&UNK_800654f0)[iVar3];
      GStack_58.h = (ushort)(byte)(&UNK_800654f1)[iVar3];
      GStack_58.v = (&UNK_800654f9)[iVar3];
      GStack_58.tpage = 0x15;
      iVar3 = (uVar5 * 3 + ((param_5 & 0xf0) >> 4)) * 4;
      GStack_58.cx = *(short *)(&UNK_80065500 + iVar3);
      GStack_58.cy = *(short *)(&UNK_80065502 + iVar3);
      GStack_58.scalex = 0x1000;
      GStack_58.scaley = 0x1000;
      GStack_58.rotate = 0;
      GStack_58.my = 0;
      GStack_58.mx = 0;
      if (param_6 == (uchar *)0x0) {
        GStack_58.r = 0x80;
        GStack_58.g = 0x80;
        GStack_58.b = 0x80;
      }
      else {
        GStack_58.r = *param_6;
        GStack_58.g = param_6[1];
        GStack_58.b = param_6[2];
      }
      GStack_58.x = param_1 + (short)(param_4 - 1) * (ushort)bVar2;
      bVar1 = param_3 < 0;
      if (bVar1) {
        param_3 = -param_3;
        param_4 = param_4 - 1;
      }
      uStack_2c = (uint)bVar1;
      uVar4 = 0;
      GStack_58.y = param_2;
      if (param_4 != 0) {
        do {
          iVar3 = param_3 / 10;
          GStack_58.u = (&UNK_800654f8)[uVar5 * 2] +
                        (&UNK_800654f0)[uVar5 * 2] * ((char)param_3 + (char)iVar3 * -10);
          GsSortFastSprite(&GStack_58,param_7,param_8);
          GStack_58.x = GStack_58.x - (ushort)bVar2;
          if ((iVar3 == 0) && ((param_5 & 0x100) == 0)) break;
          uVar4 = uVar4 + 1;
          param_3 = iVar3;
        } while (uVar4 < param_4);
      }
      if (uStack_2c != 0) {
        GStack_58.u = (&UNK_800654f8)[uVar5 * 2] + (&UNK_800654f0)[uVar5 * 2] * '\n';
        GsSortFastSprite(&GStack_58,param_7,param_8);
        return 1;
      }
      if (uStack_30 != 0) {
        GStack_58.u = (&UNK_800654f8)[uVar5 * 2] + (&UNK_800654f0)[uVar5 * 2] * '\f';
        GsSortFastSprite(&GStack_58,param_7,param_8);
      }
      return 1;
    }
  }
  return 0;
}


/* 8001b720 */

undefined4
FUN_8001b720(int param_1,undefined4 param_2,undefined4 param_3,uint param_4,int param_5,
            undefined4 param_6,uint param_7,undefined4 param_8,uint param_9,uint param_10,
            GsOT *param_11,undefined4 param_12)

{
  undefined4 uVar1;
  int iVar2;
  byte *pbVar3;
  GsSPRITE GStack_50;
  
  uVar1 = 0;
  if (param_11 != (GsOT *)0x0) {
    if ((((param_10 < 4) && (param_4 < 0x30)) && (param_7 < 0x30)) && (param_9 < 0x30)) {
      func_0x8001b364(param_1,param_2,param_3,param_5,param_4 | param_10,param_11,param_12);
      iVar2 = param_10 * 2;
      pbVar3 = &UNK_80065530 + iVar2;
      param_1 = param_1 + param_5 * (uint)*pbVar3;
      GStack_50.attribute = 0;
      GStack_50.w = (ushort)*pbVar3;
      GStack_50.h = (ushort)(byte)(&UNK_80065531)[iVar2];
      GStack_50.u = (&UNK_80065538)[iVar2] + *pbVar3 * '\v';
      GStack_50.v = (&UNK_80065539)[iVar2];
      GStack_50.tpage = 0x15;
      iVar2 = (param_10 * 3 + ((param_9 & 0xf0) >> 4)) * 4;
      GStack_50.cx = *(short *)(&UNK_80065540 + iVar2);
      GStack_50.cy = *(short *)(&UNK_80065542 + iVar2);
      GStack_50.r = 0x80;
      GStack_50.g = 0x80;
      GStack_50.b = 0x80;
      GStack_50.scalex = 0x1000;
      GStack_50.scaley = 0x1000;
      GStack_50.rotate = 0;
      GStack_50.my = 0;
      GStack_50.mx = 0;
      GStack_50.x = (short)param_1;
      GStack_50.y = (short)param_2;
      GsSortFastSprite(&GStack_50,param_11,(ushort)param_12);
      func_0x8001b364(param_1 + (uint)*pbVar3,param_2,param_6,param_8,param_7 | param_10,param_11,
                      param_12);
      uVar1 = 1;
    }
    else {
      uVar1 = 0;
    }
  }
  return uVar1;
}


/* 8001bb9c */

int FUN_8001bb9c(undefined4 param_1,int param_2)

{
  int in_v1;
  int unaff_s0;
  int iVar1;
  int unaff_s2;
  
  do {
    iVar1 = in_v1 + 1;
    if (unaff_s0 < param_2) {
      unaff_s0 = param_2;
    }
    in_v1 = func_0x8001ba88();
    param_2 = in_v1 - iVar1;
  } while (-1 < in_v1);
  if (unaff_s0 == 0) {
    unaff_s0 = FUN_8001ba58();
  }
  return unaff_s0 * unaff_s2;
}


/* 8001bc84 */

undefined4 FUN_8001bc84(void)

{
  undefined2 uStack0000001c;
  undefined2 uStack0000001e;
  
  uStack0000001c = 0x40;
  uStack0000001e = 2;
  FUN_8001eca4();
  DrawSync(0);
  FUN_8002dfe4();
  return 1;
}


/* 8001c21c */

undefined4 FUN_8001c21c(int param_1,int param_2)

{
  short sVar1;
  undefined4 in_v0;
  ushort uVar2;
  ushort *unaff_s0;
  int unaff_s1;
  int iVar3;
  int unaff_s2;
  short unaff_s3;
  short unaff_s4;
  short unaff_s5;
  uint unaff_s6;
  short unaff_s7;
  short unaff_s8;
  uint uVar4;
  uint uVar5;
  undefined4 uStack00000010;
  GsOT *pGStack00000014;
  undefined4 uStack00000018;
  GsOT *pGStack0000001c;
  undefined4 uStack00000020;
  GsSPRITE GStack00000028;
  uint in_stack_00000050;
  undefined4 in_stack_00000054;
  undefined4 in_stack_00000058;
  undefined4 in_stack_0000005c;
  undefined4 in_stack_00000060;
  undefined4 in_stack_00000064;
  undefined4 in_stack_0000009c;
  undefined4 in_stack_000000a0;
  int in_stack_000000a4;
  GsOT *in_stack_000000a8;
  undefined4 in_stack_000000ac;
  
code_r0x8001c21c:
  uStack00000010 = in_stack_000000a0;
  pGStack00000014 = (GsOT *)0x0;
  pGStack0000001c = in_stack_000000a8;
  uStack00000020 = in_stack_000000ac;
  uStack00000018 = in_v0;
  FUN_8001a9cc(param_1,param_2,DAT_8006d7b0,in_stack_0000009c);
  GStack00000028.x = DAT_8006d7b4;
  GStack00000028.y = DAT_8006d7b6;
LAB_8001c270:
  unaff_s0 = unaff_s0 + 1;
  iVar3 = unaff_s1;
LAB_8001c274:
  do {
    while( true ) {
      unaff_s1 = iVar3 + 1;
      if (in_stack_000000a4 <= unaff_s1) {
        DAT_8006d7b4 = GStack00000028.x;
        DAT_8006d7b6 = GStack00000028.y;
        return 1;
      }
      uVar2 = *unaff_s0 & 0xf000;
      if (uVar2 == 0x4000) goto LAB_8001c270;
      if (uVar2 < 0x4001) break;
      if (uVar2 == 0xc000) {
        unaff_s0 = unaff_s0 + 1;
        uStack00000010 = in_stack_000000ac;
        unaff_s1 = iVar3 + 2;
        FUN_80022c90((int)GStack00000028.x,(int)GStack00000028.y,*unaff_s0,in_stack_000000a8);
        GStack00000028.x = GStack00000028.x + (short)in_stack_00000054;
        GStack00000028.y = GStack00000028.y + (short)in_stack_00000058;
        sVar1 = (short)unaff_s2 + 1;
LAB_8001c18c:
        unaff_s2 = (int)sVar1;
        goto LAB_8001c270;
      }
      if (uVar2 < 0xc001) {
        if (uVar2 == 0x5000) {
          unaff_s0 = unaff_s0 + 1;
          unaff_s1 = iVar3 + 2;
          if (*unaff_s0 < 3) {
            unaff_s5 = (*unaff_s0 & 1) * 0x20 + 0x3c0;
            GStack00000028.cy = (DAT_8006d6c8 >> 1) + 0xfc;
          }
          else {
            unaff_s5 = (DAT_8006d6c8 & 1) * 0x20 + 0x3c0;
            GStack00000028.cy = (DAT_8006d6c8 >> 1) + 0xfc;
          }
          goto LAB_8001c270;
        }
        unaff_s0 = unaff_s0 + 1;
        iVar3 = unaff_s1;
      }
      else {
        if (uVar2 == 0xd000) {
          in_v0 = FUN_8001ba58(DAT_8006d7b0);
          param_1 = (int)GStack00000028.x;
          param_2 = (int)GStack00000028.y;
          goto code_r0x8001c21c;
        }
        unaff_s0 = unaff_s0 + 1;
        iVar3 = unaff_s1;
      }
    }
    if (uVar2 == 0x1000) {
      uStack00000010 = in_stack_000000a0;
      pGStack00000014 = in_stack_000000a8;
      uStack00000018 = in_stack_000000ac;
      sVar1 = FUN_8001c2d8((int)GStack00000028.x,(int)GStack00000028.y,DAT_8006d7ac,
                           in_stack_0000009c);
      GStack00000028.x = GStack00000028.x + sVar1 * unaff_s7;
      GStack00000028.y = GStack00000028.y + sVar1 * unaff_s8;
      sVar1 = (short)unaff_s2 + sVar1;
      goto LAB_8001c18c;
    }
    if (uVar2 < 0x1001) {
      if ((*unaff_s0 & 0xf000) == 0) {
        uVar4 = (*unaff_s0 & 0xfff) / unaff_s6;
        if (unaff_s6 == 0) {
          trap(7);
        }
        uVar5 = uVar4 / in_stack_00000050;
        if (in_stack_00000050 == 0) {
          trap(7);
        }
        GStack00000028.tpage = (ushort)((uVar5 & 1) << 4) | 0xf;
        if (unaff_s6 == 0) {
          trap(7);
        }
        GStack00000028.u = (char)((*unaff_s0 & 0xfff) % unaff_s6) * (char)in_stack_0000005c;
        GStack00000028.v =
             (char)uVar4 * (char)in_stack_00000060 + (char)uVar5 * (char)in_stack_00000064;
        GStack00000028.cx = unaff_s5 + ((ushort)uVar5 & 2) * 8;
        GsSortFastSprite(&GStack00000028,in_stack_000000a8,(ushort)in_stack_000000ac);
        GStack00000028.x = GStack00000028.x + unaff_s7;
        GStack00000028.y = GStack00000028.y + unaff_s8;
        unaff_s2 = (unaff_s2 + 1) * 0x10000 >> 0x10;
        if ((0 < DAT_8006d6ca) && (DAT_8006d6ca <= unaff_s2)) {
LAB_8001c118:
          unaff_s3 = unaff_s3 + unaff_s7;
          GStack00000028.x = unaff_s4 - unaff_s8;
          unaff_s2 = 0;
          GStack00000028.y = unaff_s3;
          unaff_s4 = GStack00000028.x;
        }
        goto LAB_8001c270;
      }
      unaff_s0 = unaff_s0 + 1;
      iVar3 = unaff_s1;
      goto LAB_8001c274;
    }
    if (uVar2 == 0x2000) goto LAB_8001c118;
    if (uVar2 == 0x3000) break;
    unaff_s0 = unaff_s0 + 1;
    iVar3 = unaff_s1;
  } while( true );
  unaff_s0 = unaff_s0 + 1;
  unaff_s1 = iVar3 + 2;
  goto LAB_8001c270;
}


/* 8001c7f8 */

undefined4
FUN_8001c7f8(int param_1,int param_2,int param_3,int param_4,undefined4 param_5,GsOT *param_6,
            undefined4 param_7,int param_8)

{
  short sVar1;
  ushort pri;
  int iVar2;
  short sVar3;
  int iVar4;
  short sVar5;
  short sVar6;
  short sVar7;
  GsSPRITE local_80;
  undefined1 auStack_58 [3];
  undefined1 local_55;
  undefined1 local_54;
  undefined1 local_53;
  undefined1 local_52;
  undefined1 local_51;
  short local_50;
  short local_4e;
  undefined1 local_4c;
  undefined1 local_4b;
  undefined2 local_4a;
  short local_48;
  short local_46;
  undefined1 local_44;
  undefined1 local_43;
  undefined2 local_42;
  short local_40;
  short local_3e;
  undefined1 local_3c;
  undefined1 local_3b;
  short local_38;
  short local_36;
  undefined1 local_34;
  undefined1 local_33;
  int local_30;
  int local_2c;
  
  local_80.attribute = 0;
  local_80.r = 0x80;
  local_80.g = 0x80;
  local_80.b = 0x80;
  local_80.rotate = 0;
  local_80.mx = 0;
  local_80.my = 0;
  local_80.scalex = 0x1000;
  local_80.scaley = 0x1000;
  local_80.cx = 0;
  local_80.cy = 0x1ff;
  local_80.tpage = 0x15;
  local_30 = param_3 + -0x10;
  local_2c = param_4 + -0x10;
  local_80.w = 0x10;
  local_80.h = 0x10;
  iVar4 = 0;
  iVar2 = 0;
  do {
    local_80.u = (&DAT_800655b8)[iVar2];
    local_80.v = (&DAT_800655b9)[iVar2];
    sVar1 = (short)param_1;
    local_80.x = sVar1 + (ushort)(byte)(&DAT_800655b0)[iVar2] * (short)local_30;
    sVar6 = (short)param_2;
    local_80.y = sVar6 + (ushort)(byte)(&DAT_800655b1)[iVar2] * (short)local_2c;
    pri = (ushort)param_7;
    GsSortFastSprite(&local_80,param_6,pri);
    iVar4 = iVar4 + 1;
    iVar2 = iVar4 * 2;
  } while (iVar4 < 4);
  local_55 = 9;
  local_51 = 0x2c;
  local_42 = 0x15;
  local_4a = 0x7fc0;
  local_54 = 0x80;
  local_53 = 0x80;
  local_52 = 0x80;
  sVar7 = sVar1 + 0xf;
  sVar5 = sVar1 + (short)local_30 + 0xf;
  local_3e = sVar6 + 0xf;
  local_4c = 0x10;
  local_4b = 0xa8;
  local_44 = 0x1f;
  local_43 = 0xa8;
  local_3c = 0x10;
  local_3b = 0xb7;
  local_34 = 0x1f;
  local_33 = 0xb7;
  local_50 = sVar7;
  local_4e = sVar6;
  local_48 = sVar5;
  local_46 = sVar6;
  local_40 = sVar7;
  local_38 = sVar5;
  local_36 = local_3e;
  GsSortPoly(auStack_58,param_6,pri);
  sVar3 = sVar6 + (short)local_2c;
  local_3e = sVar3 + 0xf;
  local_4c = 0x58;
  local_4b = 200;
  local_44 = 0x67;
  local_43 = 200;
  local_3c = 0x58;
  local_3b = 0xd7;
  local_34 = 0x67;
  local_33 = 0xd7;
  local_50 = sVar7;
  local_4e = sVar3;
  local_48 = sVar5;
  local_46 = sVar3;
  local_40 = sVar7;
  local_38 = sVar5;
  local_36 = local_3e;
  GsSortPoly(auStack_58,param_6,pri);
  sVar6 = sVar6 + 0x10;
  local_4c = 0x30;
  local_4b = 0xa8;
  local_44 = 0x3f;
  local_43 = 0xa8;
  local_3c = 0x30;
  local_3b = 0xb7;
  local_34 = 0x3f;
  local_33 = 0xb7;
  local_50 = sVar1;
  local_4e = sVar6;
  local_48 = sVar7;
  local_46 = sVar6;
  local_40 = sVar1;
  local_3e = sVar3;
  local_38 = sVar7;
  local_36 = sVar3;
  GsSortPoly(auStack_58,param_6,pri);
  local_50 = sVar1 + (short)local_30;
  local_48 = local_50 + 0xf;
  local_4c = 0x5c;
  local_4b = 0x98;
  local_44 = 0x6b;
  local_43 = 0x98;
  local_3c = 0x5c;
  local_3b = 0xa7;
  local_34 = 0x6b;
  local_33 = 0xa7;
  local_4e = sVar6;
  local_46 = sVar6;
  local_40 = local_50;
  local_3e = sVar3;
  local_38 = local_48;
  local_36 = sVar3;
  GsSortPoly(auStack_58,param_6,pri);
  if (param_8 == 0) {
    FUN_8001e244(param_1 + 3,param_2 + 3,local_30 + 0xc,local_2c + 0xc,param_5,param_6,param_7);
  }
  else {
    FUN_8001e054(param_1 + 3,param_2 + 3,local_30 + 0xc,local_2c + 0xc,param_5,param_6,param_7,1);
  }
  return 1;
}


/* 8001cbfc */

undefined4
FUN_8001cbfc(int param_1,int param_2,int param_3,int param_4,undefined4 param_5,GsOT *param_6,
            undefined4 param_7)

{
  short sVar1;
  ushort pri;
  int iVar2;
  short sVar3;
  int iVar4;
  short sVar5;
  short sVar6;
  short sVar7;
  GsSPRITE local_80;
  undefined1 auStack_58 [3];
  undefined1 local_55;
  undefined1 local_54;
  undefined1 local_53;
  undefined1 local_52;
  undefined1 local_51;
  short local_50;
  short local_4e;
  undefined1 local_4c;
  undefined1 local_4b;
  undefined2 local_4a;
  short local_48;
  short local_46;
  undefined1 local_44;
  undefined1 local_43;
  undefined2 local_42;
  short local_40;
  short local_3e;
  undefined1 local_3c;
  undefined1 local_3b;
  short local_38;
  short local_36;
  undefined1 local_34;
  undefined1 local_33;
  int local_30;
  int local_2c;
  
  local_80.attribute = 0;
  local_80.r = 0x80;
  local_80.g = 0x80;
  local_80.b = 0x80;
  local_80.rotate = 0;
  local_80.mx = 0;
  local_80.my = 0;
  local_80.scalex = 0x1000;
  local_80.scaley = 0x1000;
  local_80.cx = 0x80;
  local_80.cy = 0x1fe;
  local_80.tpage = 0x15;
  local_30 = param_3 + -8;
  local_2c = param_4 + -8;
  local_80.w = 8;
  local_80.h = 8;
  iVar4 = 0;
  iVar2 = 0;
  do {
    local_80.u = (&DAT_800655c8)[iVar2];
    local_80.v = (&DAT_800655c9)[iVar2];
    sVar1 = (short)param_1;
    local_80.x = sVar1 + (ushort)(byte)(&DAT_800655c0)[iVar2] * (short)local_30;
    sVar6 = (short)param_2;
    local_80.y = sVar6 + (ushort)(byte)(&DAT_800655c1)[iVar2] * (short)local_2c;
    pri = (ushort)param_7;
    GsSortFastSprite(&local_80,param_6,pri);
    iVar4 = iVar4 + 1;
    iVar2 = iVar4 * 2;
  } while (iVar4 < 4);
  local_55 = 9;
  local_51 = 0x2c;
  local_42 = 0x15;
  local_4a = 0x7f88;
  local_54 = 0x80;
  local_53 = 0x80;
  local_52 = 0x80;
  sVar7 = sVar1 + 7;
  sVar5 = sVar1 + (short)local_30 + 7;
  local_3e = sVar6 + 7;
  local_4c = 0xa8;
  local_4b = 0x38;
  local_44 = 0xaf;
  local_43 = 0x38;
  local_3c = 0xa8;
  local_3b = 0x3f;
  local_34 = 0xaf;
  local_33 = 0x3f;
  local_50 = sVar7;
  local_4e = sVar6;
  local_48 = sVar5;
  local_46 = sVar6;
  local_40 = sVar7;
  local_38 = sVar5;
  local_36 = local_3e;
  GsSortPoly(auStack_58,param_6,pri);
  sVar3 = sVar6 + (short)local_2c;
  local_3e = sVar3 + 8;
  local_4c = 0xd0;
  local_4b = 0x38;
  local_44 = 0xd7;
  local_43 = 0x38;
  local_3c = 0xd0;
  local_3b = 0x40;
  local_34 = 0xd7;
  local_33 = 0x40;
  local_50 = sVar7;
  local_4e = sVar3;
  local_48 = sVar5;
  local_46 = sVar3;
  local_40 = sVar7;
  local_38 = sVar5;
  local_36 = local_3e;
  GsSortPoly(auStack_58,param_6,pri);
  sVar6 = sVar6 + 8;
  local_4c = 0xb8;
  local_4b = 0x38;
  local_44 = 0xbf;
  local_43 = 0x38;
  local_3c = 0xb8;
  local_3b = 0x3f;
  local_34 = 0xbf;
  local_33 = 0x3f;
  local_50 = sVar1;
  local_4e = sVar6;
  local_48 = sVar7;
  local_46 = sVar6;
  local_40 = sVar1;
  local_3e = sVar3;
  local_38 = sVar7;
  local_36 = sVar3;
  GsSortPoly(auStack_58,param_6,pri);
  local_50 = sVar1 + (short)local_30;
  local_48 = local_50 + 8;
  local_4c = 0xc0;
  local_4b = 0x38;
  local_44 = 200;
  local_43 = 0x38;
  local_3c = 0xc0;
  local_3b = 0x3f;
  local_34 = 200;
  local_33 = 0x3f;
  local_4e = sVar6;
  local_46 = sVar6;
  local_40 = local_50;
  local_3e = sVar3;
  local_38 = local_48;
  local_36 = sVar3;
  GsSortPoly(auStack_58,param_6,pri);
  FUN_8001e244(param_1 + 3,param_2 + 3,local_30 + 4,local_2c + 4,param_5,param_6,param_7);
  return 1;
}


/* 80022ccc */

undefined4
FUN_80022ccc(short param_1,short param_2,uint param_3,int param_4,GsOT *param_5,int param_6)

{
  int iVar1;
  int iVar2;
  short sVar3;
  GsSPRITE local_40;
  
  if (param_3 < 7) {
    if (param_5 == (GsOT *)0x0) {
      return 0;
    }
    if (param_6 != 0) {
      if (param_4 == 1) {
        iVar1 = VSync(-1);
        sVar3 = (short)((iVar1 / 0x3c) % 2);
      }
      else {
        sVar3 = 0;
      }
      local_40.attribute = 0;
      local_40.r = 0x80;
      local_40.g = 0x80;
      local_40.b = 0x80;
      local_40.rotate = 0;
      local_40.mx = 0;
      local_40.my = 0;
      local_40.scalex = 0x1000;
      local_40.scaley = 0x1000;
      iVar2 = param_3 * 4;
      local_40.cx = *(short *)(&DAT_80065740 + iVar2);
      local_40.cy = *(short *)(&DAT_80065742 + iVar2) + 0x1fe;
      iVar1 = *(short *)(&DAT_80065724 + iVar2) + 0x140;
      if (iVar1 < 0) {
        iVar1 = *(short *)(&DAT_80065724 + iVar2) + 0x17f;
      }
      iVar2 = *(short *)(&DAT_80065726 + param_3 * 4) + 0x100;
      if (iVar2 < 0) {
        iVar2 = *(short *)(&DAT_80065726 + param_3 * 4) + 0x1ff;
      }
      local_40.tpage = (short)(iVar1 >> 6) + (short)((uint)iVar2 >> 8) * 0x10;
      iVar1 = param_3 * 4;
      local_40.w = (ushort)(byte)(&DAT_8006570a)[iVar1];
      local_40.h = (ushort)(byte)(&DAT_8006570b)[iVar1];
      local_40.u = (&DAT_80065708)[iVar1];
      local_40.v = (&DAT_80065709)[iVar1];
      local_40.y = (param_2 - sVar3) + -1;
      local_40.x = param_1;
      GsSortFastSprite(&local_40,param_5,(ushort)param_6);
      return 1;
    }
  }
  return 0;
}


