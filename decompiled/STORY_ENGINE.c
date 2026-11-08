/* 80012914 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80012914(void)

{
  return DAT_8007073d;
}


/* 80012934 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80012934(void)

{
  return DAT_8007073e;
}


/* 80012954 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80012954(void)

{
  return DAT_8007073f;
}


/* 80012974 */

undefined1 FUN_80012974(uint param_1)

{
  if ((param_1 & 0xff) < 4) {
    return (&DAT_80058760)[(param_1 & 0xff) + (uint)DAT_8007073c * 0xc + DAT_80070734 * 0x84];
  }
  return 0xff;
}


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


/* 80023e60 */

bool FUN_80023e60(void)

{
  bool bVar1;
  uchar *puVar2;
  
  DAT_8006d6d8 = (uchar *)FUN_8002dec4(0x1cc);
  bVar1 = DAT_8006d6d8 != (uchar *)0x0;
  if (bVar1) {
    memset(DAT_8006d6d8,'\0',0x1cc);
    puVar2 = DAT_8006d6d8;
    puVar2[0x1c] = '\0';
    puVar2[0x1d] = '\0';
    puVar2[0x1e] = '\0';
    puVar2[0x1f] = '\0';
    puVar2[0x20] = '\0';
    puVar2[0x21] = '\0';
    puVar2[0x22] = '\0';
    puVar2[0x23] = '\0';
    puVar2[0x164] = '\0';
    puVar2[0x165] = '\0';
    puVar2[0x166] = '\0';
    puVar2[0x167] = '\0';
  }
  return bVar1;
}


/* 80023eb8 */

void FUN_80023eb8(void)

{
  int iVar1;
  
  iVar1 = FUN_80011ae0();
  if ((iVar1 == 7) || (iVar1 = FUN_80011ae0(), iVar1 == 8)) {
    FUN_80029870(1);
  }
  else {
    FUN_80029870(0);
  }
  return;
}


/* 80023f10 */

undefined4
FUN_80023f10(undefined4 param_1,byte param_2,uint param_3,undefined4 param_4,short param_5,
            undefined4 param_6)

{
  int iVar1;
  int iVar2;
  
  iVar1 = DAT_8006d6d8;
  if (1 < param_3) {
    return 0;
  }
  iVar2 = param_3 * 2;
  if (*(short *)(DAT_8006d6d8 + iVar2 + 0x188) != 0) {
    return 0;
  }
  if (*(short *)(DAT_8006d6d8 + iVar2 + 0x18c) != 0) {
    return 0;
  }
  if (*(short *)(DAT_8006d6d8 + iVar2 + 400) != 0) {
    return 0;
  }
  if ((*(ushort *)(DAT_8006d6d8 + param_3 * 2 + 0x174) & 0x20) != 0) {
    return 0;
  }
  if (param_2 != 1) {
    if (param_2 < 2) {
      if (param_2 != 0) {
        return 0;
      }
      FUN_8002409c(0);
      goto LAB_80024020;
    }
    if (param_2 != 2) {
      return 0;
    }
    *(undefined2 *)(DAT_8006d6d8 + 0x1b8) = 10;
    *(undefined2 *)(iVar1 + 0x1bc) = 1;
  }
  FUN_8002409c(param_2);
  *(int *)(DAT_8006d6d8 + 0x184) = (int)param_5;
LAB_80024020:
  iVar1 = DAT_8006d6d8;
  *(undefined4 *)(DAT_8006d6d8 + param_3 * 4 + 0x17c) = param_1;
  *(byte *)(iVar1 + param_3 + 0x178) = param_2;
  iVar1 = DAT_8006d6d8;
  iVar2 = DAT_8006d6d8 + param_3 * 2;
  *(undefined2 *)(iVar2 + 0x188) = 10;
  *(undefined2 *)(iVar2 + 0x18c) = 10;
  *(undefined2 *)(iVar2 + 400) = 10;
  iVar1 = iVar1 + param_3 * 4;
  *(undefined4 *)(iVar1 + 0x194) = param_4;
  *(undefined4 *)(iVar1 + 0x15c) = param_6;
  VSync(-1);
  return 1;
}


/* 8002409c */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_8002409c(uint param_1)

{
  int iVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  undefined4 auStack_20 [4];
  
  auStack_20[0] = _UNK_8001010c;
  auStack_20[1] = _UNK_80010110;
  auStack_20[2] = _UNK_80010114;
  if (*(int *)(DAT_8006d6d8 + 0x154) == 0) {
    *(undefined4 *)(DAT_8006d6d8 + 0x158) = 0;
    uVar2 = FUN_8002dbb8(auStack_20[param_1 & 0xff]);
    uVar3 = FUN_8002dec4(uVar2);
    iVar1 = DAT_8006d6d8;
    *(undefined4 *)(DAT_8006d6d8 + 0x154) = uVar3;
    FUN_8002d838(auStack_20[param_1 & 0xff],*(undefined4 *)(iVar1 + 0x154),uVar2,&UNK_80024154,0);
  }
  return;
}


/* 80024164 */

bool FUN_80024164(undefined4 param_1)

{
  int iVar1;
  byte bVar2;
  
  iVar1 = FUN_80024464();
  bVar2 = iVar1 != 0;
  iVar1 = FUN_80024b70(param_1);
  if (iVar1 != 0) {
    bVar2 = bVar2 + 1;
  }
  iVar1 = FUN_80025210(param_1);
  if (iVar1 != 0) {
    bVar2 = bVar2 + 1;
  }
  if (*(int *)(DAT_8006d6d8 + 0x158) == 1) {
    bVar2 = bVar2 + 1;
  }
  iVar1 = FUN_80024258(param_1);
  if (iVar1 != 0) {
    bVar2 = bVar2 + 1;
  }
  if (4 < bVar2) {
    VSync(-1);
  }
  return 4 < bVar2;
}


/* 80024234 */

void FUN_80024234(int param_1)

{
  ushort *puVar1;
  
  puVar1 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
  *puVar1 = *puVar1 & 0xffef;
  return;
}


/* 80024258 */

undefined4 FUN_80024258(int param_1)

{
  undefined4 uVar1;
  
  if ((*(char *)(DAT_8006d6d8 + param_1 + 0x178) == '\x02') &&
     ((uint)(int)*(short *)(DAT_8006d6d8 + 0x1b8) < 0x1f)) {
                    /* WARNING: Could not recover jumptable at 0x800242bc. Too many branches */
                    /* WARNING: Treating indirect jump as call */
    uVar1 = (*(code *)(&PTR_LAB_8001011c)[*(short *)(DAT_8006d6d8 + 0x1b8)])();
    return uVar1;
  }
  return 1;
}


/* 80024464 */

/* WARNING: Removing unreachable block (ram,0x8002484c) */
/* WARNING: Removing unreachable block (ram,0x80024870) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_80024464(uint param_1)

{
  undefined1 *puVar1;
  byte bVar2;
  uint uVar3;
  int iVar4;
  undefined4 uVar5;
  int iVar6;
  uint uVar7;
  undefined4 uVar8;
  int iVar9;
  uint uVar10;
  undefined4 *puVar11;
  int iVar12;
  int *piVar13;
  uint *puVar14;
  ushort *puVar15;
  short sVar16;
  uint in_t0;
  short *psVar17;
  int iVar18;
  RECT RStack_40;
  int aiStack_38 [4];
  undefined1 auStack_28 [8];
  
  iVar12 = DAT_8006d6d8;
  aiStack_38[0] = _UNK_8006d6dc;
  aiStack_38[1] = _UNK_8006d6e0;
  aiStack_38[2] = _UNK_8006d6e4;
  aiStack_38[3] = _UNK_8006d6e8;
  switch(*(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x188)) {
  default:
    return 1;
  case 10:
    uVar10 = (uint)*(byte *)(DAT_8006d6d8 + param_1 + 0x178);
    if (uVar10 == 2) {
      iVar12 = aiStack_38[*(int *)(DAT_8006d6d8 + 0x184) + 2] +
               *(int *)(DAT_8006d6d8 + param_1 * 4 + 0x17c);
    }
    else {
      iVar12 = aiStack_38[uVar10] + *(int *)(DAT_8006d6d8 + param_1 * 4 + 0x17c);
      if (param_1 == 1) {
        iVar12 = iVar12 + *(int *)(DAT_8006d6d8 + 0x184);
      }
    }
    uVar8 = FUN_8002dbb8(iVar12);
    uVar5 = FUN_8002df30(uVar8);
    puVar11 = (undefined4 *)(DAT_8006d6d8 + 0x84 + param_1 * 4);
    *puVar11 = uVar5;
    iVar12 = FUN_8002d838(iVar12,*puVar11,uVar8,FUN_80024b10,param_1);
    if (iVar12 == 0) {
      if (*(int *)(DAT_8006d6d8 + param_1 * 4 + 0x84) == 0) {
        return 0;
      }
      FUN_8002dfe4();
      return 0;
    }
    psVar17 = (short *)(DAT_8006d6d8 + 0x188 + param_1 * 2);
    *psVar17 = *psVar17 + 1;
    break;
  case 0xb:
    break;
  case 0xc:
    if ((*(ushort *)(DAT_8006d6d8 + param_1 * 2 + 0x174) & 0x10) != 0) {
      return 0;
    }
    *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x188) = 0x14;
    break;
  case 0x14:
    iVar9 = param_1 * 4;
    piVar13 = (int *)(DAT_8006d6d8 + 0x8c + iVar9);
    iVar18 = *piVar13;
    *piVar13 = iVar18 + 0x10;
    uVar10 = iVar18 + 0x13U & 3;
    uVar3 = iVar18 + 0x10U & 3;
    uVar7 = (*(int *)((iVar18 + 0x13U) - uVar10) << (3 - uVar10) * 8 |
            (uint)piVar13 & 0xffffffffU >> (uVar10 + 1) * 8) & -1 << (4 - uVar3) * 8 |
            *(uint *)((iVar18 + 0x10U) - uVar3) >> uVar3 * 8;
    uVar10 = iVar9 + iVar12 + 0x147;
    uVar3 = uVar10 & 3;
    puVar14 = (uint *)(uVar10 - uVar3);
    *puVar14 = *puVar14 & -1 << (uVar3 + 1) * 8 | uVar7 >> (3 - uVar3) * 8;
    uVar10 = iVar9 + iVar12 + 0x144;
    uVar3 = uVar10 & 3;
    puVar14 = (uint *)(uVar10 - uVar3);
    *puVar14 = *puVar14 & 0xffffffffU >> (4 - uVar3) * 8 | uVar7 << uVar3 * 8;
    iVar12 = DAT_8006d6d8;
    piVar13 = (int *)(DAT_8006d6d8 + 0x8c + iVar9);
    *piVar13 = *piVar13 + 4;
    bVar2 = *(byte *)(iVar12 + param_1 + 0x178);
    if (bVar2 == 1) {
      sVar16 = 0xc;
    }
    else {
      sVar16 = 6;
      if ((bVar2 < 2) && (bVar2 == 0)) {
        sVar16 = 5;
      }
    }
    iVar12 = param_1 * 4;
    iVar9 = 0;
    if (0 < *(int *)(DAT_8006d6d8 + iVar12 + 0x144)) {
      iVar18 = DAT_8006d6d8;
      do {
        puVar11 = (undefined4 *)(iVar18 + 0x8c + iVar12);
        psVar17 = (short *)*puVar11;
        *puVar11 = psVar17 + 4;
        RStack_40.x = sVar16 * 0x40 + *psVar17;
        RStack_40.y = psVar17[1];
        RStack_40.w = psVar17[2];
        RStack_40.h = psVar17[3];
        LoadImage2(&RStack_40,(u_long *)*puVar11);
        iVar18 = DAT_8006d6d8;
        iVar4 = (uint)(ushort)psVar17[2] * (uint)(ushort)psVar17[3] * 2;
        iVar6 = iVar4;
        if (iVar4 < 0) {
          iVar6 = iVar4 + 3;
        }
        piVar13 = (int *)(DAT_8006d6d8 + 0x8c + iVar12);
        *piVar13 = (uint)(ushort)psVar17[2] * (uint)(ushort)psVar17[3] * 2 +
                   iVar4 + (iVar6 >> 2) * -4 + *piVar13;
        iVar9 = iVar9 + 1;
      } while (iVar9 < *(int *)(iVar18 + iVar12 + 0x144));
    }
    *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x188) = 0x1e;
    break;
  case 0x1e:
    bVar2 = *(byte *)(DAT_8006d6d8 + param_1 + 0x178);
    if (bVar2 == 1) {
      iVar12 = 0x7d40;
    }
    else if (bVar2 < 2) {
      iVar12 = 0x3c00;
      if (bVar2 == 0) {
        iVar12 = 0x3f00;
      }
    }
    else {
      iVar12 = 0x3c00;
    }
    RStack_40.y = (short)(iVar12 >> 6);
    RStack_40.x = ((short)iVar12 + RStack_40.y * -0x40) * 0x10;
    RStack_40.h = 1;
    iVar9 = param_1 * 4;
    iVar12 = iVar9 + DAT_8006d6d8;
    uVar7 = *(uint *)(DAT_8006d6d8 + iVar9 + 0x8c);
    uVar10 = uVar7 + 3 & 3;
    uVar3 = uVar7 & 3;
    uVar7 = (*(int *)((uVar7 + 3) - uVar10) << (3 - uVar10) * 8 |
            param_1 & 0xffffffffU >> (uVar10 + 1) * 8) & -1 << (4 - uVar3) * 8 |
            *(uint *)(uVar7 - uVar3) >> uVar3 * 8;
    uVar10 = iVar12 + 0x14f;
    uVar3 = uVar10 & 3;
    puVar14 = (uint *)(uVar10 - uVar3);
    *puVar14 = *puVar14 & -1 << (uVar3 + 1) * 8 | uVar7 >> (3 - uVar3) * 8;
    uVar10 = iVar12 + 0x14c;
    uVar3 = uVar10 & 3;
    puVar14 = (uint *)(uVar10 - uVar3);
    *puVar14 = *puVar14 & 0xffffffffU >> (4 - uVar3) * 8 | uVar7 << uVar3 * 8;
    iVar12 = DAT_8006d6d8;
    piVar13 = (int *)(DAT_8006d6d8 + 0x8c + iVar9);
    *piVar13 = *piVar13 + 4;
    uVar8 = FUN_8002dec4(*(int *)(iVar12 + iVar9 + 0x14c) << 2);
    iVar12 = DAT_8006d6d8 + iVar9;
    *(undefined4 *)(iVar12 + 0x9c) = uVar8;
    iVar18 = 0;
    if (0 < *(int *)(iVar12 + 0x14c)) {
      do {
        puVar14 = (uint *)(DAT_8006d6d8 + 0x8c + iVar9);
        uVar7 = *puVar14;
        uVar10 = uVar7 + 3 & 3;
        uVar3 = uVar7 & 3;
        in_t0 = (*(int *)((uVar7 + 3) - uVar10) << (3 - uVar10) * 8 |
                in_t0 & 0xffffffffU >> (uVar10 + 1) * 8) & -1 << (4 - uVar3) * 8 |
                *(uint *)(uVar7 - uVar3) >> uVar3 * 8;
        puVar1 = auStack_28 + 3;
        uVar10 = (uint)puVar1 & 3;
        *(uint *)(puVar1 + -uVar10) =
             *(uint *)(puVar1 + -uVar10) & -1 << (uVar10 + 1) * 8 | in_t0 >> (3 - uVar10) * 8;
        *puVar14 = *puVar14 + 4;
        auStack_28._0_2_ = SUB42(in_t0,0);
        RStack_40.w = auStack_28._0_2_;
        if (0x140 < (int)RStack_40.x + (int)(short)auStack_28._0_2_) {
          RStack_40.x = 0;
          RStack_40.y = RStack_40.y + 1;
        }
        auStack_28._0_4_ = in_t0;
        LoadImage2(&RStack_40,*(u_long **)(DAT_8006d6d8 + iVar9 + 0x8c));
        piVar13 = (int *)(DAT_8006d6d8 + 0x9c + iVar9);
        *(short *)(iVar18 * 4 + *piVar13) = RStack_40.x;
        *(short *)(iVar18 * 4 + *piVar13 + 2) = RStack_40.y;
        iVar12 = DAT_8006d6d8;
        RStack_40.x = RStack_40.x + auStack_28._0_2_;
        if (0x13f < RStack_40.x) {
          RStack_40.x = 0;
          RStack_40.y = RStack_40.y + 1;
        }
        if ((ushort)RStack_40.y - 0x100 < 0xf0) {
          RStack_40.y = 0x1f0;
        }
        piVar13 = (int *)(DAT_8006d6d8 + 0x8c + iVar9);
        *piVar13 = (short)auStack_28._0_2_ * 2 + *piVar13;
        iVar18 = iVar18 + 1;
      } while (iVar18 < *(int *)(iVar12 + iVar9 + 0x14c));
    }
    *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x188) = 0x28;
    break;
  case 0x28:
    FUN_8002dfe4(*(undefined4 *)(DAT_8006d6d8 + param_1 * 4 + 0x84));
    iVar12 = DAT_8006d6d8;
    iVar9 = DAT_8006d6d8 + param_1 * 4;
    *(undefined4 *)(iVar9 + 0x84) = 0;
    *(undefined4 *)(iVar9 + 0x8c) = 0;
    *(undefined2 *)(iVar12 + param_1 * 2 + 0x188) = 0;
    puVar15 = (ushort *)(iVar12 + 0x174 + param_1 * 2);
    *puVar15 = *puVar15 | 0x20;
    return 1;
  }
  return 0;
}


/* 80024b10 */

void FUN_80024b10(int param_1)

{
  int iVar1;
  short *psVar2;
  int iVar3;
  
  VSync(-1);
  iVar1 = DAT_8006d6d8;
  iVar3 = DAT_8006d6d8 + param_1 * 4;
  *(undefined4 *)(iVar3 + 0x8c) = *(undefined4 *)(iVar3 + 0x84);
  psVar2 = (short *)(iVar1 + 0x188 + param_1 * 2);
  *psVar2 = *psVar2 + 1;
  return;
}


/* 80024b70 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_80024b70(int param_1)

{
  undefined1 *puVar1;
  byte bVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  uchar *puVar5;
  uint uVar6;
  undefined4 *puVar7;
  int iVar8;
  ushort *puVar9;
  int iVar10;
  short *psVar11;
  int iVar12;
  int *piVar13;
  int *piVar14;
  short asStack_38 [4];
  undefined1 auStack_30 [4];
  undefined2 uStack_2c;
  int aiStack_28 [4];
  
  puVar1 = auStack_30 + 3;
  uVar6 = (uint)puVar1 & 3;
  *(uint *)(puVar1 + -uVar6) =
       *(uint *)(puVar1 + -uVar6) & -1 << (uVar6 + 1) * 8 | _UNK_8006d6ec >> (3 - uVar6) * 8;
  auStack_30 = (undefined1  [4])_UNK_8006d6ec;
  uStack_2c = _UNK_8006d6f0;
  aiStack_28[0] = _UNK_8006d6f4;
  aiStack_28[1] = _UNK_8006d6f8;
  aiStack_28[2] = _UNK_8006d6fc;
  aiStack_28[3] = _UNK_8006d700;
  switch(*(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x18c)) {
  default:
    goto LAB_800251a0;
  case 10:
    uVar6 = (uint)*(byte *)(DAT_8006d6d8 + param_1 + 0x178);
    if (uVar6 == 2) {
      iVar8 = aiStack_28[*(int *)(DAT_8006d6d8 + 0x184) + 2] +
              *(int *)(DAT_8006d6d8 + param_1 * 4 + 0x17c);
    }
    else {
      iVar8 = aiStack_28[uVar6] + *(int *)(DAT_8006d6d8 + param_1 * 4 + 0x17c);
      if (param_1 == 1) {
        iVar8 = iVar8 + *(int *)(DAT_8006d6d8 + 0x184);
      }
    }
    uVar4 = FUN_8002dbb8(iVar8);
    uVar3 = FUN_8002dec4(uVar4);
    puVar7 = (undefined4 *)(DAT_8006d6d8 + 0xa4 + param_1 * 4);
    *puVar7 = uVar3;
    iVar8 = FUN_8002d838(iVar8,*puVar7,uVar4,FUN_800251c8,param_1);
    if (iVar8 == 0) {
      if (*(int *)(DAT_8006d6d8 + param_1 * 4 + 0xa4) == 0) {
        return 0;
      }
      FUN_8002dfe4();
      return 0;
    }
    psVar11 = (short *)(DAT_8006d6d8 + 0x18c + param_1 * 2);
    *psVar11 = *psVar11 + 1;
    break;
  case 0xb:
    break;
  case 0xc:
    *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x18c) = 0x14;
  case 0x14:
    iVar8 = DAT_8006d6d8;
    piVar14 = (int *)(DAT_8006d6d8 + 0xa4 + param_1 * 4);
    iVar12 = *piVar14;
    *(int *)(DAT_8006d6d8 + param_1 * 4 + 0xac) = iVar12 + 0x10;
    piVar13 = (int *)(param_1 * 0x2c + 0xb4 + iVar8);
    *piVar13 = *piVar14 + *(int *)(iVar12 + 0x10);
    piVar13[1] = *piVar14 + *(int *)(iVar12 + 0x14);
    piVar13[2] = *piVar14 + *(int *)(iVar12 + 0x18);
    piVar13[3] = *piVar14 + *(int *)(iVar12 + 0x24);
    piVar13[4] = *piVar14 + *(int *)(iVar12 + 0x1c);
    piVar13[5] = *piVar14 + *(int *)(iVar12 + 0x20);
    piVar13[6] = *piVar14 + *(int *)(iVar12 + 0x28);
    piVar13[7] = *piVar14 + *(int *)(iVar12 + 0x2c);
    piVar13[8] = *piVar14 + *(int *)(iVar12 + 0x30);
    piVar13[9] = *piVar14 + *(int *)(iVar12 + 0x34);
    piVar13[10] = *piVar14 + *(int *)(iVar12 + 0x38);
    iVar10 = iVar8 + param_1 * 0x1c;
    *(undefined2 *)(iVar10 + 0x10c) = 0xffff;
    *(undefined2 *)(iVar10 + 0x10e) = *(undefined2 *)(iVar12 + 0x3c);
    *(short *)(iVar10 + 0x110) =
         *(short *)(iVar12 + 0x3c) -
         *(short *)(auStack_30 + (uint)*(byte *)(iVar8 + param_1 + 0x178) * 2);
    *(undefined4 *)(iVar10 + 0x124) = 0;
    psVar11 = (short *)(iVar8 + 0x18c + param_1 * 2);
    *psVar11 = *psVar11 + 1;
  case 0x15:
    if ((*(ushort *)(DAT_8006d6d8 + param_1 * 2 + 0x174) & 0x20) != 0) {
      *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x18c) = 0x1e;
    }
    break;
  case 0x1e:
    piVar14 = (int *)(param_1 * 0x2c + 0xb4 + DAT_8006d6d8);
    uVar4 = FUN_8002dec4(*(int *)(DAT_8006d6d8 + param_1 * 4 + 0x144) * 0x24);
    iVar8 = DAT_8006d6d8;
    *(undefined4 *)(DAT_8006d6d8 + param_1 * 4 + 0x94) = uVar4;
    bVar2 = *(byte *)(iVar8 + param_1 + 0x178);
    if (bVar2 == 1) {
      asStack_38[0] = 0xc;
LAB_80024f94:
      asStack_38[0] = asStack_38[0] << 6;
    }
    else {
      asStack_38[0] = 6;
      if (1 < bVar2) goto LAB_80024f94;
      asStack_38[0] = 0x180;
      if (bVar2 == 0) {
        asStack_38[0] = 5;
        goto LAB_80024f94;
      }
    }
    asStack_38[1] = 0;
    iVar8 = param_1 * 4;
    iVar12 = 0;
    if (0 < *(int *)(DAT_8006d6d8 + iVar8 + 0x144)) {
      iVar10 = 0;
      do {
        FUN_80025380(param_1,(iVar10 + iVar12) * 4 + *piVar14,asStack_38,
                     iVar12 * 0x24 + *(int *)(DAT_8006d6d8 + iVar8 + 0x94));
        iVar12 = iVar12 + 1;
        iVar10 = iVar12 * 2;
      } while (iVar12 < *(int *)(DAT_8006d6d8 + iVar8 + 0x144));
    }
    iVar8 = param_1 * 0x1c;
    puVar5 = (uchar *)FUN_8002dec4((int)*(short *)(DAT_8006d6d8 + iVar8 + 0x10e) << 1);
    iVar12 = DAT_8006d6d8 + iVar8;
    *(uchar **)(iVar12 + 0x114) = puVar5;
    memset(puVar5,'\0',(int)*(short *)(iVar12 + 0x10e) << 1);
    if (*(char *)(DAT_8006d6d8 + param_1 + 0x178) == '\x02') {
      puVar5 = (uchar *)FUN_8002dec4((int)*(short *)(DAT_8006d6d8 + iVar8 + 0x10e));
      iVar12 = DAT_8006d6d8 + iVar8;
      *(uchar **)(iVar12 + 0x118) = puVar5;
      memset(puVar5,'\0',(int)*(short *)(iVar12 + 0x10e));
      puVar5 = (uchar *)FUN_8002dec4((int)*(short *)(DAT_8006d6d8 + iVar8 + 0x10e));
      iVar8 = DAT_8006d6d8 + iVar8;
      *(uchar **)(iVar8 + 0x11c) = puVar5;
      memset(puVar5,'\0',(int)*(short *)(iVar8 + 0x10e));
    }
    else {
      iVar8 = DAT_8006d6d8 + param_1 * 0x1c;
      *(undefined4 *)(iVar8 + 0x118) = 0;
      *(undefined4 *)(iVar8 + 0x11c) = 0;
    }
    puVar5 = (uchar *)FUN_8002dec4((int)*(short *)(DAT_8006d6d8 + param_1 * 0x1c + 0x10e));
    iVar8 = DAT_8006d6d8 + param_1 * 0x1c;
    *(uchar **)(iVar8 + 0x120) = puVar5;
    memset(puVar5,'\0',(int)*(short *)(iVar8 + 0x10e));
    iVar8 = DAT_8006d6d8;
    puVar9 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar9 = *puVar9 | 0x40;
    *(undefined2 *)(iVar8 + param_1 * 2 + 0x18c) = 0x28;
  case 0x28:
    *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 0x18c) = 0;
LAB_800251a0:
    return 1;
  }
  return 0;
}


/* 800251c8 */

void FUN_800251c8(int param_1)

{
  short *psVar1;
  
  VSync(-1);
  psVar1 = (short *)(DAT_8006d6d8 + 0x18c + param_1 * 2);
  *psVar1 = *psVar1 + 1;
  return;
}


/* 80025210 */

undefined4 FUN_80025210(int param_1)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  short *psVar4;
  
  if (*(char *)(DAT_8006d6d8 + param_1 + 0x178) == '\x02') {
    uVar2 = 1;
  }
  else {
    uVar2 = 0;
    switch(*(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 400)) {
    case 10:
      if ((*(ushort *)(DAT_8006d6d8 + param_1 * 2 + 0x174) & 0x40) != 0) {
        psVar4 = (short *)(DAT_8006d6d8 + 400 + param_1 * 2);
        *psVar4 = *psVar4 + 1;
      }
      break;
    case 0xb:
      iVar3 = FUN_80018cb8(param_1,*(undefined4 *)(DAT_8006d6d8 + param_1 * 4 + 0x194),&LAB_80025350
                          );
      iVar1 = DAT_8006d6d8;
      if (iVar3 != 0) {
        *(int *)(DAT_8006d6d8 + 0x19c) = param_1;
        psVar4 = (short *)(iVar1 + 400 + param_1 * 2);
        *psVar4 = *psVar4 + 1;
      }
      break;
    case 0xc:
      break;
    case 0xd:
      *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 400) = 0x1e;
    case 0x1e:
      *(undefined2 *)(DAT_8006d6d8 + param_1 * 2 + 400) = 0;
    default:
      uVar2 = 1;
    }
  }
  return uVar2;
}


/* 80025380 */

void FUN_80025380(int param_1,short *param_2,short *param_3,undefined4 *param_4)

{
  short sVar1;
  u_short uVar2;
  int iVar3;
  int iVar4;
  int *piVar5;
  undefined4 uVar6;
  char cVar7;
  
  uVar6 = 0;
  sVar1 = *param_2;
  cVar7 = '\x04';
  if (sVar1 != 4) {
    cVar7 = '\x02';
    uVar6 = 0x1000000;
  }
  *param_4 = uVar6;
  *(undefined2 *)(param_4 + 1) = 0x140;
  *(undefined2 *)((int)param_4 + 6) = 0xf0;
  *(short *)(param_4 + 2) = param_2[4];
  *(short *)((int)param_4 + 10) = param_2[5];
  uVar2 = GetTPage((uint)(sVar1 != 4),0,(int)*param_3 + (int)param_2[2],
                   (int)param_3[1] + (int)param_2[3]);
  *(u_short *)(param_4 + 3) = uVar2;
  iVar4 = (int)*param_3 + (int)param_2[2];
  iVar3 = iVar4;
  if (iVar4 < 0) {
    iVar3 = iVar4 + 0x3f;
  }
  *(char *)((int)param_4 + 0xe) = ((char)iVar4 + (char)(iVar3 >> 6) * -0x40) * cVar7;
  *(char *)((int)param_4 + 0xf) = (char)param_3[1] + (char)param_2[3];
  piVar5 = (int *)(DAT_8006d6d8 + 0x9c + param_1 * 4);
  *(undefined2 *)(param_4 + 4) = *(undefined2 *)(param_2[1] * 4 + *piVar5);
  *(undefined2 *)((int)param_4 + 0x12) = *(undefined2 *)(param_2[1] * 4 + *piVar5 + 2);
  *(undefined1 *)((int)param_4 + 0x16) = 0x80;
  *(undefined1 *)((int)param_4 + 0x15) = 0x80;
  *(undefined1 *)(param_4 + 5) = 0x80;
  *(undefined2 *)((int)param_4 + 0x1a) = 0;
  *(undefined2 *)(param_4 + 6) = 0;
  *(undefined2 *)((int)param_4 + 0x1e) = 0x1000;
  *(undefined2 *)(param_4 + 7) = 0x1000;
  param_4[8] = 0;
  return;
}


/* 80026338 */

void FUN_80026338(void)

{
  ushort uVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  uchar *puVar5;
  int iVar6;
  undefined4 uVar7;
  undefined4 uVar8;
  undefined4 uVar9;
  int iVar10;
  undefined4 *puVar11;
  int iVar12;
  undefined4 *puVar13;
  ushort *puVar14;
  int iVar15;
  int iVar16;
  int iVar17;
  int iVar18;
  short *psVar19;
  short sVar20;
  
  iVar3 = DAT_8006d6d8;
  if (*(int *)(DAT_8006d6d8 + 0x164) == 0) {
    iVar16 = 0;
    iVar15 = 0;
    if (0 < *(short *)(DAT_8006d6d8 + 0x10e)) {
      iVar4 = 0;
      do {
        iVar18 = *(short *)(iVar4 + *(int *)(DAT_8006d6d8 + 0xdc)) * 8 +
                 *(int *)(DAT_8006d6d8 + 0xd4);
        iVar4 = (int)*(short *)(iVar18 + 4);
        iVar18 = iVar4 + *(short *)(iVar18 + 6);
        if (iVar4 < iVar18) {
          do {
            puVar14 = (ushort *)(iVar4 * 0x1c + *(int *)(DAT_8006d6d8 + 0xd0));
            if (*puVar14 - 3 < 4) {
              iVar16 = iVar16 + (short)puVar14[3];
            }
            iVar4 = iVar4 + 1;
          } while (iVar4 < iVar18);
        }
        iVar15 = iVar15 + 1;
        iVar4 = iVar15 * 2;
      } while (iVar15 < *(short *)(DAT_8006d6d8 + 0x10e));
    }
    if (iVar16 == 0) {
      *(undefined4 *)(DAT_8006d6d8 + 0x164) = 0;
      *(undefined4 *)(iVar3 + 0x168) = 0;
      *(undefined4 *)(iVar3 + 0x16c) = 0;
      *(undefined4 *)(iVar3 + 0x170) = 0;
      return;
    }
    puVar5 = (uchar *)FUN_8002dec4(iVar16 * 0xc);
    *(uchar **)(DAT_8006d6d8 + 0x164) = puVar5;
    memset(puVar5,'\0',iVar16 * 0xc);
  }
  iVar15 = 0;
  sVar20 = 0;
  iVar16 = 0;
  if (0 < *(short *)(DAT_8006d6d8 + 0x10e)) {
    do {
      psVar19 = (short *)(*(short *)(iVar16 * 2 + *(int *)(iVar3 + 0xdc)) * 8 +
                         *(int *)(iVar3 + 0xd4));
      iVar4 = (int)psVar19[2];
      iVar18 = iVar4 + psVar19[3];
      for (; iVar4 < iVar18; iVar4 = iVar4 + 1) {
        puVar14 = (ushort *)(iVar4 * 0x1c + *(int *)(iVar3 + 0xd0));
        if (*puVar14 - 3 < 4) {
          iVar6 = (int)(short)puVar14[2];
          iVar17 = iVar6 + (short)puVar14[3];
          iVar2 = DAT_8006d6d8;
          for (; DAT_8006d6d8 = iVar2, iVar6 < iVar17; iVar6 = iVar6 + 1) {
            iVar12 = iVar15 * 0xc;
            iVar10 = iVar6 * 0xc;
            *(undefined2 *)(iVar12 + *(int *)(iVar2 + 0x164) + 2) =
                 *(undefined2 *)(iVar10 + *(int *)(iVar3 + 0xb8) + 2);
            *(short *)(iVar12 + *(int *)(iVar2 + 0x164) + 4) =
                 sVar20 + *(short *)(iVar10 + *(int *)(iVar3 + 0xb8));
            *(undefined2 *)(iVar12 + *(int *)(iVar2 + 0x164) + 6) =
                 *(undefined2 *)(iVar10 + *(int *)(iVar3 + 0xb8) + 6);
            *(undefined4 *)(iVar12 + *(int *)(iVar2 + 0x164) + 8) = 0;
            uVar1 = *puVar14;
            if (uVar1 == 4) {
              *(undefined1 *)(iVar15 * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) = 0x20;
            }
            else if ((short)uVar1 < 5) {
              if (uVar1 == 3) {
                *(undefined1 *)(iVar15 * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) = 0x10;
              }
            }
            else if (uVar1 == 5) {
              *(undefined1 *)(iVar15 * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) = 0x30;
            }
            else if (uVar1 == 6) {
              *(undefined1 *)(iVar15 * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) = 0x40;
              *(undefined2 *)(iVar15 * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 6) =
                   *(undefined2 *)(DAT_8006d6d8 + 0x15c);
            }
            iVar15 = iVar15 + 1;
            iVar2 = DAT_8006d6d8;
          }
        }
      }
      sVar20 = sVar20 + -1 + *psVar19;
      iVar16 = iVar16 + 1;
    } while (iVar16 < *(short *)(DAT_8006d6d8 + 0x10e));
  }
  *(int *)(DAT_8006d6d8 + 0x170) = iVar15;
  iVar3 = DAT_8006d6d8;
  iVar16 = 0;
  if (0 < iVar15) {
    do {
      iVar15 = iVar16 + 1;
      if (iVar15 < *(int *)(iVar3 + 0x170)) {
        do {
          puVar13 = (undefined4 *)(iVar16 * 0xc + *(int *)(iVar3 + 0x164));
          iVar4 = iVar15 * 0xc;
          if (*(short *)(iVar4 + *(int *)(iVar3 + 0x164) + 4) < *(short *)(puVar13 + 1)) {
            uVar7 = *puVar13;
            uVar8 = puVar13[1];
            uVar9 = puVar13[2];
            puVar11 = (undefined4 *)(iVar16 * 0xc + *(int *)(iVar3 + 0x164));
            puVar13 = (undefined4 *)(iVar4 + *(int *)(iVar3 + 0x164));
            *puVar11 = *puVar13;
            puVar11[1] = puVar13[1];
            puVar11[2] = puVar13[2];
            puVar13 = (undefined4 *)(iVar4 + *(int *)(iVar3 + 0x164));
            *puVar13 = uVar7;
            puVar13[1] = uVar8;
            puVar13[2] = uVar9;
          }
          iVar15 = iVar15 + 1;
        } while (iVar15 < *(int *)(iVar3 + 0x170));
      }
      iVar16 = iVar16 + 1;
    } while (iVar16 < *(int *)(iVar3 + 0x170));
  }
  iVar3 = DAT_8006d6d8;
  *(undefined4 *)(DAT_8006d6d8 + 0x168) = 0;
  *(undefined4 *)(iVar3 + 0x16c) = 0;
  *(undefined2 *)(iVar3 + 400) = 0x14;
  *(undefined1 *)(*(int *)(iVar3 + 0x170) * 0xc + *(int *)(iVar3 + 0x164) + 1) = 0x50;
  return;
}


/* 80026880 */

undefined4 FUN_80026880(void)

{
  undefined4 uVar1;
  
  if ((uint)(int)*(short *)(DAT_8006d6d8 + 400) < 0x1f) {
                    /* WARNING: Could not recover jumptable at 0x800268c4. Too many branches */
                    /* WARNING: Treating indirect jump as call */
    uVar1 = (*(code *)(&PTR_LAB_800103ec)[*(short *)(DAT_8006d6d8 + 400)])();
    return uVar1;
  }
  return 1;
}


/* 80026984 */

void FUN_80026984(void)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int unaff_s0;
  
  *(int *)(DAT_8006d6d8 + 0x1a4) = unaff_s0;
  uVar2 = FUN_80012954();
  iVar3 = FUN_800193a0(uVar2,*(undefined1 *)(DAT_8006d6d8 + 0x184),*(undefined1 *)(unaff_s0 + 2),
                       FUN_8002883c);
  iVar1 = DAT_8006d6d8;
  if (iVar3 == 0) {
    *(ushort *)(DAT_8006d6d8 + 0x174) = *(ushort *)(DAT_8006d6d8 + 0x174) | 2;
  }
  else {
    *(ushort *)(DAT_8006d6d8 + 0x174) = *(ushort *)(DAT_8006d6d8 + 0x174) & 0xfffd;
    *(short *)(iVar1 + 400) = *(short *)(iVar1 + 400) + 1;
  }
  return;
}


/* 80026e24 */

void FUN_80026e24(void)

{
  int iVar1;
  ushort *puVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  ushort uVar6;
  short *psVar7;
  int iVar8;
  short *psVar9;
  int iVar10;
  int iVar11;
  int iVar12;
  uint uVar13;
  int aiStack_30 [8];
  
  if (DAT_8006d6d8 != 0) {
    iVar1 = FUN_80011f7c();
    iVar12 = 0;
    if (iVar1 == 0) {
      iVar1 = 0;
      do {
        *(undefined4 *)((int)aiStack_30 + iVar1) = 0;
        *(undefined4 *)((int)aiStack_30 + iVar1 + 0x10) = 0;
        iVar12 = iVar12 + 1;
        iVar1 = iVar12 * 4;
      } while (iVar12 < 4);
      uVar13 = (uint)(*(char *)(DAT_8006d6d8 + 0x178) != '\x02');
      iVar1 = 0;
      do {
        puVar2 = (ushort *)(DAT_8006d6d8 + 0x174 + uVar13 * 2);
        uVar6 = *puVar2 ^ 0x100;
        *puVar2 = uVar6;
        if (((uVar6 & 0x80) != 0) && ((uVar6 & 0x100) != 0)) {
          iVar3 = FUN_80028a88(uVar13);
          iVar12 = DAT_8006d6d8;
          iVar11 = uVar13 * 0x2c + 0xb4 + DAT_8006d6d8;
          iVar10 = 0;
          if (0 < iVar3) {
            iVar4 = DAT_8006d6d8 + 0x120;
            iVar5 = DAT_8006d6d8 + 0x174;
            iVar8 = DAT_8006d6d8 + 0x114;
            do {
              if ((*(byte *)(*(int *)(iVar4 + uVar13 * 0x1c) + iVar10) & 1) != 0) {
                uVar6 = *(ushort *)(iVar5 + uVar13 * 2);
                if (((((uVar6 & 4) == 0) && ((uVar6 & 8) == 0)) && ((uVar6 & 2) == 0)) &&
                   ((uVar6 & 1) == 0)) {
                  psVar7 = (short *)(iVar10 * 2 + *(int *)(iVar8 + uVar13 * 0x1c));
                  *psVar7 = *psVar7 + 1;
                }
                psVar7 = (short *)(*(short *)(iVar10 * 2 + *(int *)(iVar11 + 0x28)) * 8 +
                                  *(int *)(iVar11 + 0x20));
                psVar9 = (short *)(iVar10 * 2 + *(int *)(iVar8 + uVar13 * 0x1c));
                if (*psVar7 <= *psVar9) {
                  *psVar9 = *psVar7 + -1;
                }
                if (*(char *)(iVar12 + 0x178) == '\x02') {
                  iVar1 = iVar1 + *(short *)(iVar10 * 2 + *(int *)(iVar12 + uVar13 * 0x1c + 0x114));
                }
                else {
                  aiStack_30[uVar13 * 4 + iVar10] =
                       (int)*(short *)(iVar10 * 2 + *(int *)(iVar8 + uVar13 * 0x1c));
                }
              }
              iVar10 = iVar10 + 1;
            } while (iVar10 < iVar3);
          }
        }
        uVar13 = uVar13 - 1;
      } while (-1 < (int)uVar13);
      iVar12 = 1;
      if (*(char *)(DAT_8006d6d8 + 0x178) == '\x02') {
        FUN_80027178(0,iVar1);
      }
      else {
        aiStack_30[0] = aiStack_30[0] + aiStack_30[4];
        iVar1 = 4;
        do {
          iVar3 = *(int *)((int)aiStack_30 + iVar1);
          if (iVar3 <= *(int *)((int)aiStack_30 + iVar1 + 0x10)) {
            iVar3 = aiStack_30[iVar12 + 4];
          }
          aiStack_30[0] = aiStack_30[0] + iVar3;
          iVar12 = iVar12 + 1;
          iVar1 = iVar12 * 4;
        } while (iVar12 < 4);
        if (((*(ushort *)(DAT_8006d6d8 + 0x174) & 0x180) == 0x180) ||
           ((*(ushort *)(DAT_8006d6d8 + 0x176) & 0x180) == 0x180)) {
          FUN_80027178(0,aiStack_30[0]);
        }
      }
    }
  }
  return;
}


/* 80027178 */

void FUN_80027178(undefined4 param_1,int param_2)

{
  byte bVar1;
  int iVar2;
  int iVar3;
  
  if (*(int *)(DAT_8006d6d8 + 0x164) == 0) {
    return;
  }
  iVar2 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  if (param_2 < *(short *)(iVar2 + 4)) {
    return;
  }
  iVar3 = *(int *)(iVar2 + 8);
  bVar1 = *(byte *)(DAT_8006d6d8 + iVar3 + 0x178);
  if (1 < bVar1) {
    if (bVar1 != 2) {
      return;
    }
    bVar1 = *(byte *)(iVar2 + 1) & 0xf0;
    if (bVar1 == 0x20) {
      iVar2 = FUN_80027edc();
    }
    else if (bVar1 < 0x21) {
      if (bVar1 != 0x10) goto LAB_80027334;
      iVar2 = FUN_8002833c(iVar3);
    }
    else if (bVar1 == 0x30) {
      iVar2 = FUN_800279c4(iVar3);
    }
    else {
      if (bVar1 != 0x40) goto LAB_80027334;
      iVar2 = FUN_80027c80(iVar3);
    }
    if (iVar2 != 0) {
      return;
    }
LAB_80027334:
    FUN_80028440(iVar3,param_2);
    return;
  }
  bVar1 = *(byte *)(iVar2 + 1) & 0xf0;
  if (bVar1 == 0x30) {
    iVar2 = FUN_800279c4(iVar3);
  }
  else if (bVar1 < 0x31) {
    if (bVar1 == 0x10) {
      iVar2 = FUN_80027724(iVar3);
    }
    else {
      if (bVar1 != 0x20) goto LAB_80027298;
      iVar2 = FUN_8002788c(iVar3);
    }
  }
  else {
    if (bVar1 != 0x40) {
      if (bVar1 == 0x50) {
        return;
      }
      goto LAB_80027298;
    }
    iVar2 = FUN_80027c80(iVar3);
  }
  if (iVar2 != 0) {
    return;
  }
LAB_80027298:
  FUN_80027488(iVar3);
  return;
}


/* 80027350 */

int FUN_80027350(int param_1)

{
  int iVar1;
  int iVar2;
  ushort *puVar3;
  int iVar4;
  
  iVar2 = DAT_8006d6d8;
  if (*(int *)(DAT_8006d6d8 + 0x164) == 0) {
    iVar1 = 0;
  }
  else {
    iVar1 = 2;
    do {
      iVar4 = *(int *)(iVar2 + 0x16c) * 0xc + *(int *)(iVar2 + 0x164);
      if ((*(byte *)(iVar4 + 1) & 0xf0) == 0x10) {
        iVar1 = 1;
      }
      else if ((*(byte *)(iVar4 + 1) & 0xf0) == 0x50) {
        iVar1 = 0;
      }
      else {
        *(int *)(iVar2 + 0x16c) = *(int *)(iVar2 + 0x16c) + 1;
      }
    } while (iVar1 == 2);
    if (iVar1 == 1) {
      iVar2 = FUN_8002875c(*(undefined4 *)(DAT_8006d6d8 + 0x16c),
                           *(undefined4 *)(DAT_8006d6d8 + 0x1a0));
      if (iVar2 == 0) {
        puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
        *puVar3 = *puVar3 | 2;
        iVar1 = 2;
      }
    }
    puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar3 = *puVar3 & 0xfffd;
  }
  return iVar1;
}


/* 80027488 */

void FUN_80027488(int param_1)

{
  bool bVar1;
  int iVar2;
  ushort *puVar3;
  byte bVar4;
  int iVar5;
  int iVar6;
  
  iVar5 = DAT_8006d6d8;
  bVar4 = *(byte *)(*(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) &
          0xf0;
  if (bVar4 == 0x30) {
LAB_80027638:
    *(int *)(DAT_8006d6d8 + 0x168) = *(int *)(DAT_8006d6d8 + 0x168) + 1;
  }
  else {
    if (bVar4 < 0x31) {
      if (bVar4 == 0x10) {
        if ((*(byte *)(*(int *)(DAT_8006d6d8 + 0x16c) * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) &
            1) != 0) {
          return;
        }
        bVar1 = false;
        do {
          iVar6 = *(int *)(iVar5 + 0x16c) * 0xc + *(int *)(iVar5 + 0x164);
          if ((*(byte *)(iVar6 + 1) & 0xf0) == 0x10) {
            bVar1 = true;
          }
          else {
            if ((*(byte *)(iVar6 + 1) & 0xf0) == 0x50) {
              *(byte *)(iVar6 + 1) = *(byte *)(iVar6 + 1) | 1;
              goto LAB_80027638;
            }
            *(int *)(iVar5 + 0x16c) = *(int *)(iVar5 + 0x16c) + 1;
          }
          iVar6 = 0;
        } while (!bVar1);
        iVar5 = 0;
      }
      else {
        iVar6 = 0;
        if (bVar4 == 0x20) goto LAB_80027638;
        iVar5 = 0;
      }
    }
    else {
      if (bVar4 == 0x40) goto LAB_80027638;
      iVar6 = 0;
      if (bVar4 == 0x50) {
        return;
      }
      iVar5 = 0;
    }
    do {
      iVar2 = func_0x8001841c(iVar5 + 2);
      if (iVar2 != 0) {
        iVar6 = iVar6 + 1;
      }
      iVar5 = iVar5 + 1;
    } while (iVar5 < 3);
    if (iVar6 < 3) {
      iVar6 = FUN_8002875c(*(undefined4 *)(DAT_8006d6d8 + 0x16c),
                           *(undefined4 *)(DAT_8006d6d8 + 0x1a0));
      iVar5 = DAT_8006d6d8;
      if (iVar6 != 0) {
        puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
        *puVar3 = *puVar3 & 0xfffd;
        *(int *)(iVar5 + 0x168) = *(int *)(iVar5 + 0x168) + 1;
        *(int *)(iVar5 + 0x16c) = *(int *)(iVar5 + 0x16c) + 1;
        iVar5 = DAT_8006d6d8;
        bVar1 = false;
        do {
          iVar6 = *(int *)(iVar5 + 0x16c) * 0xc + *(int *)(iVar5 + 0x164);
          if ((*(byte *)(iVar6 + 1) & 0xf0) == 0x10) {
            bVar1 = true;
          }
          else {
            if ((*(byte *)(iVar6 + 1) & 0xf0) == 0x50) {
              return;
            }
            *(int *)(iVar5 + 0x16c) = *(int *)(iVar5 + 0x16c) + 1;
          }
        } while (!bVar1);
        return;
      }
    }
    puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar3 = *puVar3 | 2;
  }
  return;
}


/* 80027724 */

undefined4 FUN_80027724(int param_1)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  ushort *puVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  
  iVar7 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  uVar2 = 0;
  if ((*(byte *)(iVar7 + 1) & 4) == 0) {
    iVar6 = 0;
    if ((*(byte *)(iVar7 + 1) & 2) != 0) {
      iVar5 = 0;
      do {
        iVar3 = func_0x8001841c(iVar5 + 2);
        iVar1 = DAT_8006d6d8;
        if (iVar3 != 0) {
          iVar6 = iVar6 + 1;
        }
        iVar5 = iVar5 + 1;
      } while (iVar5 < 3);
      if (iVar6 < 3) {
        puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
        *puVar4 = *puVar4 & 0xfffd;
        if ((*(byte *)(iVar7 + 1) & 4) != 0) {
          return 0;
        }
        func_0x80018f84(*(undefined4 *)(iVar1 + 0x1a0),*(int *)(iVar1 + 0x1ac) + 2,
                        (int)*(short *)(iVar7 + 6));
        FUN_80027e40(0);
        *(byte *)(iVar7 + 1) = *(byte *)(iVar7 + 1) | 4;
        iVar7 = DAT_8006d6d8;
        iVar6 = *(int *)(DAT_8006d6d8 + 0x1a0) + 1;
        *(int *)(DAT_8006d6d8 + 0x1a0) = iVar6;
        if (iVar6 < 3) {
          return 0;
        }
        *(undefined4 *)(iVar7 + 0x1a0) = 0;
        return 0;
      }
    }
    puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar4 = *puVar4 | 2;
    uVar2 = 1;
  }
  return uVar2;
}


/* 8002788c */

undefined4 FUN_8002788c(int param_1)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  ushort *puVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  
  iVar7 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  uVar2 = 0;
  if ((*(byte *)(iVar7 + 1) & 4) == 0) {
    iVar6 = 0;
    iVar5 = 0;
    do {
      iVar3 = func_0x8001841c(iVar5 + 5);
      iVar1 = DAT_8006d6d8;
      if (iVar3 != 0) {
        iVar6 = iVar6 + 1;
      }
      iVar5 = iVar5 + 1;
    } while (iVar5 < 3);
    if (iVar6 < 3) {
      puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
      *puVar4 = *puVar4 & 0xfffd;
      uVar2 = 0;
      if ((*(byte *)(iVar7 + 1) & 4) == 0) {
        func_0x80018d88(param_1,(int)*(short *)(iVar7 + 2),*(int *)(iVar1 + 0x1b0) + 5,
                        (int)*(short *)(iVar7 + 6));
        FUN_80027e40(1);
        *(byte *)(iVar7 + 1) = *(byte *)(iVar7 + 1) | 4;
        uVar2 = 0;
      }
    }
    else {
      puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
      *puVar4 = *puVar4 | 2;
      uVar2 = 1;
    }
  }
  return uVar2;
}


/* 800279c4 */

undefined4 FUN_800279c4(int param_1)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  ushort *puVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  
  iVar7 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  uVar2 = 0;
  if ((*(byte *)(iVar7 + 1) & 4) == 0) {
    iVar6 = 0;
    iVar5 = 0;
    do {
      iVar3 = func_0x8001841c(iVar5 + 5);
      iVar1 = DAT_8006d6d8;
      if (iVar3 != 0) {
        iVar6 = iVar6 + 1;
      }
      iVar5 = iVar5 + 1;
    } while (iVar5 < 3);
    if (iVar6 < 3) {
      puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
      *puVar4 = *puVar4 & 0xfffd;
      uVar2 = 0;
      if ((*(byte *)(iVar7 + 1) & 4) == 0) {
        if (*(char *)(iVar1 + param_1 + 0x178) == '\x02') {
          FUN_80018300(0x4c00,3,(int)*(short *)(iVar7 + 2),*(int *)(iVar1 + 0x1b0) + 5,1);
          FUN_80018468(*(int *)(DAT_8006d6d8 + 0x1b0) + 5,0xb9);
          FUN_80018508(*(int *)(DAT_8006d6d8 + 0x1b0) + 5,(int)*(short *)(iVar7 + 6));
        }
        else {
          FUN_80018300(0x4c00,3,(int)*(short *)(iVar7 + 2),*(int *)(DAT_8006d6d8 + 0x1b0) + 5,1);
          FUN_80018468(*(int *)(DAT_8006d6d8 + 0x1b0) + 5,0xb9);
          FUN_80018508(*(int *)(DAT_8006d6d8 + 0x1b0) + 5,(int)*(short *)(iVar7 + 6));
        }
        FUN_80027e40(1);
        *(byte *)(iVar7 + 1) = *(byte *)(iVar7 + 1) | 4;
        uVar2 = 0;
      }
    }
    else {
      puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
      *puVar4 = *puVar4 | 2;
      uVar2 = 1;
    }
  }
  return uVar2;
}


/* 80027c80 */

undefined4 FUN_80027c80(int param_1)

{
  int iVar1;
  int iVar2;
  ushort *puVar3;
  undefined4 uVar4;
  int iVar5;
  
  iVar5 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  iVar2 = func_0x8001f770(*(undefined1 *)(DAT_8006d6d8 + param_1 * 4 + 0x15c));
  iVar1 = DAT_8006d6d8;
  if (iVar2 == 0) {
    puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar3 = *puVar3 & 0xfffd;
    uVar4 = 0;
    if ((*(byte *)(iVar5 + 1) & 4) == 0) {
      uVar4 = FUN_8001e50c(*(short *)(iVar5 + 2) + 1,*(undefined4 *)(iVar1 + 0x154));
      func_0x8001f4b8(*(undefined1 *)(DAT_8006d6d8 + param_1 * 4 + 0x15c),uVar4);
      func_0x8001f568(*(undefined1 *)(DAT_8006d6d8 + param_1 * 4 + 0x15c));
      *(byte *)(iVar5 + 1) = *(byte *)(iVar5 + 1) | 4;
      uVar4 = 0;
    }
  }
  else {
    puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar3 = *puVar3 | 2;
    uVar4 = 1;
  }
  return uVar4;
}


/* 80027e40 */

void FUN_80027e40(char param_1)

{
  int iVar1;
  int iVar2;
  
  iVar1 = DAT_8006d6d8;
  if (param_1 == '\0') {
    iVar2 = *(int *)(DAT_8006d6d8 + 0x1ac) + 1;
    *(int *)(DAT_8006d6d8 + 0x1ac) = iVar2;
    if (2 < iVar2) {
      *(undefined4 *)(iVar1 + 0x1ac) = 0;
      return;
    }
  }
  else if (param_1 == '\x01') {
    iVar2 = *(int *)(DAT_8006d6d8 + 0x1b0) + 1;
    *(int *)(DAT_8006d6d8 + 0x1b0) = iVar2;
    if (2 < iVar2) {
      *(undefined4 *)(iVar1 + 0x1b0) = 0;
      return;
    }
  }
  else {
    iVar2 = *(int *)(DAT_8006d6d8 + 0x1b4) + 1;
    *(int *)(DAT_8006d6d8 + 0x1b4) = iVar2;
    if (1 < iVar2) {
      *(undefined4 *)(iVar1 + 0x1b4) = 0;
    }
  }
  return;
}


/* 80027edc */

undefined4 FUN_80027edc(void)

{
  undefined2 uVar1;
  ushort uVar2;
  int iVar3;
  short sVar4;
  int iVar5;
  uint uVar6;
  undefined4 uVar7;
  uint unaff_s1;
  int iVar8;
  
  iVar3 = DAT_8006d6d8;
  iVar8 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  if ((*(byte *)(iVar8 + 1) & 4) != 0) {
    return 0;
  }
  if ((*(byte *)(iVar8 + 1) & 1) == 0) {
    if (*(int *)(DAT_8006d6d8 + 0x1a8) != 0) goto code_r0x80028258;
    unaff_s1 = 0;
    for (sVar4 = *(short *)(iVar8 + 2); iVar5 = (int)sVar4, 9 < iVar5; sVar4 = sVar4 + -10) {
      unaff_s1 = (int)((unaff_s1 + 1) * 0x10000) >> 0x10;
    }
    uVar1 = *(undefined2 *)(iVar8 + 6);
    uVar2 = *(ushort *)(DAT_8006d6d8 + 0x1ba);
    *(ushort *)(DAT_8006d6d8 + 0x1ba) = uVar2 | 2;
    if (2 < (int)unaff_s1) {
      *(ushort *)(iVar3 + 0x1ba) = uVar2 & 0xfffd;
      unaff_s1 = (int)((unaff_s1 - 3) * 0x10000) >> 0x10;
    }
    if ((*(ushort *)(DAT_8006d6d8 + 0x1ba) & 1) == 0) {
LAB_80028058:
      iVar5 = func_0x80017dc4(0,*(undefined4 *)(DAT_8006d6d8 + iVar5 * 4 + 0x1c4),&UNK_800282a8);
      iVar3 = DAT_8006d6d8;
      if (iVar5 == 0) goto code_r0x80028258;
      *(short *)(DAT_8006d6d8 + 0x1bc) = sVar4;
      *(short *)(iVar3 + 0x1be) = (short)unaff_s1;
      *(undefined2 *)(iVar3 + 0x1c0) = uVar1;
      *(int *)(iVar3 + 0x1a8) = iVar8;
    }
    else {
      if (*(short *)(DAT_8006d6d8 + 0x1bc) != iVar5) {
        FUN_8001807c();
        *(ushort *)(DAT_8006d6d8 + 0x1ba) = *(ushort *)(DAT_8006d6d8 + 0x1ba) & 0xfffe;
      }
      iVar3 = DAT_8006d6d8;
      if ((*(ushort *)(DAT_8006d6d8 + 0x1ba) & 1) == 0) goto LAB_80028058;
      *(short *)(DAT_8006d6d8 + 0x1bc) = sVar4;
      *(short *)(iVar3 + 0x1be) = (short)unaff_s1;
      *(undefined2 *)(iVar3 + 0x1c0) = uVar1;
      *(undefined4 *)(iVar3 + 0x1a8) = 0;
      *(byte *)(iVar8 + 1) = *(byte *)(iVar8 + 1) | 2;
    }
    *(byte *)(iVar8 + 1) = *(byte *)(iVar8 + 1) | 1;
  }
  if ((*(byte *)(iVar8 + 1) & 2) != 0) {
    if ((*(byte *)(iVar8 + 1) & 4) == 0) {
      sVar4 = *(short *)(DAT_8006d6d8 + 0x1be);
      if (sVar4 == 1) {
        uVar7 = FUN_80012974(*(undefined1 *)(DAT_8006d6d8 + 0x1bc));
        uVar6 = func_0x800182d4(uVar7);
        unaff_s1 = uVar6 >> 1 & 0xff;
      }
      else if (sVar4 < 2) {
        if (sVar4 == 0) {
          unaff_s1 = 0;
        }
      }
      else if (sVar4 == 2) {
        uVar7 = FUN_80012974(*(undefined1 *)(DAT_8006d6d8 + 0x1bc));
        unaff_s1 = func_0x800182d4(uVar7);
      }
      if ((*(ushort *)(DAT_8006d6d8 + 0x1ba) & 1) == 0) {
        if ((*(ushort *)(DAT_8006d6d8 + 0x1ba) & 2) == 0) {
          func_0x80017ee0(0,0);
        }
        else {
          func_0x80017ee0(0,1);
        }
        FUN_8001811c(unaff_s1 & 0xff);
        *(ushort *)(DAT_8006d6d8 + 0x1ba) = *(ushort *)(DAT_8006d6d8 + 0x1ba) | 1;
      }
      if (*(short *)(DAT_8006d6d8 + 0x1c0) == 0) {
        if (unaff_s1 == 0) {
          FUN_8001807c();
          *(ushort *)(DAT_8006d6d8 + 0x1ba) = *(ushort *)(DAT_8006d6d8 + 0x1ba) & 0xfffe;
        }
        else {
          FUN_8001811c(unaff_s1 & 0xff);
        }
      }
      else {
        uVar7 = FUN_80018180();
        func_0x80018190(uVar7,unaff_s1 & 0xff,((int)*(short *)(DAT_8006d6d8 + 0x1c0) & 0x7fffU) << 1
                        ,&UNK_800282f4);
      }
      *(byte *)(iVar8 + 1) = *(byte *)(iVar8 + 1) | 4;
    }
    *(ushort *)(DAT_8006d6d8 + 0x174) = *(ushort *)(DAT_8006d6d8 + 0x174) & 0xfffd;
    return 0;
  }
code_r0x80028258:
  *(ushort *)(DAT_8006d6d8 + 0x174) = *(ushort *)(DAT_8006d6d8 + 0x174) | 2;
  return 1;
}


/* 8002833c */

undefined4 FUN_8002833c(int param_1)

{
  int iVar1;
  ushort *puVar2;
  int iVar3;
  
  iVar3 = *(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  if ((*(byte *)(iVar3 + 1) & 2) == 0) {
    puVar2 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
  }
  else {
    puVar2 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar2 = *puVar2 & 0xfffd;
    if ((*(byte *)(iVar3 + 1) & 4) != 0) {
      return 0;
    }
    iVar1 = FUN_80019358();
    if (iVar1 == 0) {
      func_0x80019254();
      func_0x80019370((int)*(short *)(iVar3 + 6));
      *(byte *)(iVar3 + 1) = *(byte *)(iVar3 + 1) | 4;
      return 0;
    }
    puVar2 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
  }
  *puVar2 = *puVar2 | 2;
  return 1;
}


/* 80028440 */

void FUN_80028440(int param_1,int param_2)

{
  int iVar1;
  undefined4 uVar2;
  byte bVar3;
  ushort *puVar4;
  bool bVar5;
  int iVar6;
  int iVar7;
  
  iVar6 = *(int *)(DAT_8006d6d8 + 0x16c) * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
  bVar3 = *(byte *)(*(int *)(DAT_8006d6d8 + 0x168) * 0xc + *(int *)(DAT_8006d6d8 + 0x164) + 1) &
          0xf0;
  if (bVar3 == 0x30) {
LAB_80028670:
    *(int *)(DAT_8006d6d8 + 0x168) = *(int *)(DAT_8006d6d8 + 0x168) + 1;
  }
  else {
    if (bVar3 < 0x31) {
      if (bVar3 == 0x10) {
        if ((*(byte *)(iVar6 + 1) & 1) != 0) {
          return;
        }
        iVar1 = FUN_80019358();
        iVar7 = DAT_8006d6d8;
        if (iVar1 != 0) {
          if ((*(byte *)(iVar6 + 1) & 0xf0) != 0x10) {
            return;
          }
          if (param_2 < *(short *)(iVar6 + 4) + -1) {
            return;
          }
LAB_80028648:
          puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
          *puVar4 = *puVar4 | 2;
          return;
        }
        bVar5 = false;
        do {
          iVar6 = *(int *)(iVar7 + 0x16c) * 0xc + *(int *)(iVar7 + 0x164);
          if ((*(byte *)(iVar6 + 1) & 0xf0) == 0x10) {
            bVar5 = true;
          }
          else {
            if ((*(byte *)(iVar6 + 1) & 0xf0) == 0x50) {
              *(byte *)(iVar6 + 1) = *(byte *)(iVar6 + 1) | 1;
              goto LAB_80028670;
            }
            *(int *)(iVar7 + 0x16c) = *(int *)(iVar7 + 0x16c) + 1;
          }
        } while (!bVar5);
        iVar7 = FUN_80019188();
        if (iVar7 == 0) goto LAB_80028648;
        if (*(int *)(DAT_8006d6d8 + 0x1a4) != 0) {
          puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
          *puVar4 = *puVar4 | 2;
          return;
        }
        *(int *)(DAT_8006d6d8 + 0x1a4) = iVar6;
        uVar2 = FUN_80012954();
        iVar7 = FUN_800193a0(uVar2,*(undefined1 *)(DAT_8006d6d8 + 0x184),*(undefined1 *)(iVar6 + 2),
                             FUN_8002883c);
        if (iVar7 == 0) goto LAB_80028648;
        *(byte *)(iVar6 + 1) = *(byte *)(iVar6 + 1) | 1;
      }
      else if (bVar3 == 0x20) goto LAB_80028670;
    }
    else {
      if (bVar3 == 0x40) goto LAB_80028670;
      if (bVar3 == 0x50) {
        return;
      }
    }
    iVar6 = DAT_8006d6d8;
    puVar4 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar4 = *puVar4 & 0xfffd;
    *(int *)(iVar6 + 0x168) = *(int *)(iVar6 + 0x168) + 1;
    *(int *)(iVar6 + 0x16c) = *(int *)(iVar6 + 0x16c) + 1;
    iVar6 = DAT_8006d6d8;
    bVar5 = false;
    do {
      iVar7 = *(int *)(iVar6 + 0x16c) * 0xc + *(int *)(iVar6 + 0x164);
      if ((*(byte *)(iVar7 + 1) & 0xf0) == 0x10) {
        bVar5 = true;
      }
      else {
        if ((*(byte *)(iVar7 + 1) & 0xf0) == 0x50) {
          return;
        }
        *(int *)(iVar6 + 0x16c) = *(int *)(iVar6 + 0x16c) + 1;
      }
    } while (!bVar5);
  }
  return;
}


/* 8002875c */

undefined4 FUN_8002875c(int param_1,undefined4 param_2)

{
  int iVar1;
  
  if (*(int *)(DAT_8006d6d8 + 0x164) != 0) {
    if (*(int *)(DAT_8006d6d8 + 0x1a4) != 0) {
      return 0;
    }
    iVar1 = param_1 * 0xc + *(int *)(DAT_8006d6d8 + 0x164);
    *(int *)(DAT_8006d6d8 + 0x1a4) = iVar1;
    if ((*(byte *)(iVar1 + 1) & 1) != 0) {
      return 1;
    }
    iVar1 = FUN_80018e1c(param_2,**(undefined1 **)(DAT_8006d6d8 + 0x1a4),
                         (int)*(short *)(*(undefined1 **)(DAT_8006d6d8 + 0x1a4) + 2),FUN_8002883c);
    if (iVar1 != 0) {
      *(byte *)(*(int *)(DAT_8006d6d8 + 0x1a4) + 1) =
           *(byte *)(*(int *)(DAT_8006d6d8 + 0x1a4) + 1) | 1;
      return 1;
    }
    *(undefined4 *)(DAT_8006d6d8 + 0x1a4) = 0;
  }
  return 0;
}


/* 8002883c */

void FUN_8002883c(void)

{
  *(byte *)(*(int *)(DAT_8006d6d8 + 0x1a4) + 1) = *(byte *)(*(int *)(DAT_8006d6d8 + 0x1a4) + 1) | 2;
  *(byte *)(*(int *)(DAT_8006d6d8 + 0x1a4) + 1) =
       *(byte *)(*(int *)(DAT_8006d6d8 + 0x1a4) + 1) & 0xfb;
  *(undefined4 *)(DAT_8006d6d8 + 0x1a4) = 0;
  return;
}


/* 80028888 */

void FUN_80028888(void)

{
  *DAT_8006d6d8 = DAT_800ab3e0;
  return;
}


/* 8002889c */

void FUN_8002889c(void)

{
  FUN_80045f48(*DAT_8006d6d8);
  return;
}


/* 800288c8 */

bool FUN_800288c8(uint param_1)

{
  ushort *puVar1;
  
  if (param_1 < 2) {
    FUN_80011f58(FUN_80026e24);
    FUN_80028934(param_1,0);
    puVar1 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
    *puVar1 = *puVar1 | 0x80;
  }
  return param_1 < 2;
}


/* 80028934 */

undefined4 FUN_80028934(uint param_1,short param_2)

{
  int iVar1;
  byte *pbVar2;
  
  if (1 < param_1) {
    return 0;
  }
  iVar1 = DAT_8006d6d8 + param_1 * 0x1c;
  if ((int)param_2 < (int)*(short *)(iVar1 + 0x10e)) {
    *(short *)(iVar1 + 0x10c) = param_2;
    pbVar2 = (byte *)(*(int *)(iVar1 + 0x120) + (int)param_2);
    *pbVar2 = *pbVar2 | 1;
    return 1;
  }
  return 0;
}


/* 800289a4 */

bool FUN_800289a4(uint param_1)

{
  bool bVar1;
  short sVar2;
  byte *pbVar3;
  int iVar4;
  
  if (1 < param_1) {
    return false;
  }
  iVar4 = DAT_8006d6d8 + param_1 * 0x1c;
  sVar2 = *(short *)(iVar4 + 0x10c) + 1;
  *(short *)(iVar4 + 0x10c) = sVar2;
  bVar1 = (int)sVar2 < *(short *)(iVar4 + 0x10e) + -1;
  if (!bVar1) {
    *(short *)(iVar4 + 0x10c) = *(short *)(iVar4 + 0x10e) + -1;
  }
  iVar4 = DAT_8006d6d8 + param_1 * 0x1c;
  pbVar3 = (byte *)(*(int *)(iVar4 + 0x120) + (int)*(short *)(iVar4 + 0x10c));
  *pbVar3 = *pbVar3 | 1;
  return bVar1;
}


/* 80028a48 */

int FUN_80028a48(int param_1)

{
  return (int)*(short *)(DAT_8006d6d8 + param_1 * 0x1c + 0x10c);
}


/* 80028a88 */

int FUN_80028a88(int param_1)

{
  return (int)*(short *)(DAT_8006d6d8 + param_1 * 0x1c + 0x10e);
}


/* 80028aa8 */

int FUN_80028aa8(int param_1,int param_2)

{
  return (int)*(short *)(param_2 * 2 + *(int *)(DAT_8006d6d8 + param_1 * 0x1c + 0x114));
}


/* 80028afc */

void FUN_80028afc(int param_1)

{
  int iVar1;
  
  iVar1 = DAT_8006d6d8;
  if (*(char *)(DAT_8006d6d8 + 0x178) == '\x02') {
    if ((*(ushort *)(DAT_8006d6d8 + 0x174) & 4) == 0) {
      if ((*(ushort *)(DAT_8006d6d8 + 0x174) & 8) != 0) {
        *(ushort *)(DAT_8006d6d8 + 0x174) = *(ushort *)(DAT_8006d6d8 + 0x174) & 0xfff7;
        *(undefined1 *)(*(int *)(iVar1 + 0x11c) + param_1) = 1;
      }
    }
    else {
      *(ushort *)(DAT_8006d6d8 + 0x174) = *(ushort *)(DAT_8006d6d8 + 0x174) & 0xfffb;
      *(undefined1 *)(*(int *)(iVar1 + 0x118) + param_1) = 1;
      iVar1 = FUN_80019358();
      if (iVar1 != 0) {
        FUN_800192c8();
      }
    }
  }
  return;
}


/* 80028ba8 */

void FUN_80028ba8(int param_1)

{
  int iVar1;
  ushort *puVar2;
  
  iVar1 = DAT_8006d6d8;
  puVar2 = (ushort *)(DAT_8006d6d8 + 0x174 + param_1 * 2);
  *puVar2 = *puVar2 | 1;
  if ((*(char *)(iVar1 + 0x178) == '\x02') && (iVar1 = FUN_80019358(), iVar1 != 0)) {
    FUN_800192c8();
  }
  return;
}


/* 80028c08 */

undefined4 FUN_80028c08(uint param_1,int param_2)

{
  short sVar1;
  short sVar2;
  short sVar3;
  DR_ENV *pDVar4;
  ushort uVar5;
  int iVar6;
  int iVar7;
  DRAWENV *pDVar8;
  int iVar9;
  ushort *puVar10;
  int iVar11;
  int iVar12;
  int iVar13;
  int iVar14;
  int iStack_90;
  int iStack_8c;
  short sStack_88;
  short sStack_86;
  short sStack_84;
  short sStack_82;
  RECT RStack_80;
  RECT RStack_78;
  int iStack_70;
  int iStack_6c;
  int iStack_50;
  undefined1 auStack_48 [2];
  undefined1 auStack_46 [2];
  undefined1 auStack_44 [2];
  short sStack_42;
  ushort auStack_40 [2];
  undefined4 uStack_3c;
  short *psStack_38;
  int iStack_34;
  int iStack_30;
  
  FUN_80028888();
  uStack_3c = 0;
  if (param_1 < 2) {
    iVar12 = param_1 * 0x2c + 0xb4 + DAT_8006d6d8;
    psStack_38 = (short *)(*(short *)(param_2 * 2 + *(int *)(iVar12 + 0x28)) * 8 +
                          *(int *)(iVar12 + 0x20));
    if (param_2 <= (int)psStack_38[2] + (int)psStack_38[3]) {
      iVar13 = (int)*(short *)(param_2 * 2 + *(int *)(DAT_8006d6d8 + param_1 * 0x1c + 0x114));
      iVar14 = (int)psStack_38[2] + (int)psStack_38[3] + -1;
      if (0 < psStack_38[3]) {
        *(uint *)(DAT_8006d6d8 + 0x1c) = *(uint *)(DAT_8006d6d8 + 0x1c) ^ 1;
        if (psStack_38[2] <= iVar14) {
          iStack_30 = param_1 * 7;
          do {
            puVar10 = (ushort *)(iVar14 * 0x1c + *(int *)(iVar12 + 0x1c));
            if (*puVar10 < 3) {
              iVar6 = FUN_8002af18(puVar10,iVar12,iVar13,&sStack_42,&sStack_88,auStack_40);
              if (sStack_42 == -1) {
                if (((auStack_40[0] & 4) != 0) && (*(char *)(DAT_8006d6d8 + 0x178) == '\x02')) {
                  *(undefined1 *)(*(int *)(DAT_8006d6d8 + iStack_30 * 4 + 0x118) + param_2) = 0;
                  *(undefined1 *)(*(int *)(DAT_8006d6d8 + iStack_30 * 4 + 0x11c) + param_2) = 0;
                }
              }
              else {
                iVar6 = (iVar13 - *(short *)(iVar6 * 0xc + *(int *)(iVar12 + 4))) * 0x10000 >> 0x10;
                if ((-1 < iVar6) &&
                   (iVar7 = FUN_8002b1d4(puVar10,iVar12,iVar13,&iStack_70), iVar7 != 0)) {
                  if (iStack_50 == -1) {
                    iStack_90 = iStack_70;
                    iStack_8c = iStack_6c;
                  }
                  else {
                    FUN_80021e90(&iStack_70,&iStack_90,3);
                  }
                  FUN_8002b57c(puVar10,iVar12,iVar13,&sStack_84);
                  FUN_80045f48(*(undefined4 *)
                                (*(int *)(DAT_8006d6d8 + 0x20) * 4 +
                                *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 0x14)));
                  GsClearOt(0,0,(GsOT *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                        *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 +
                                                4)));
                  if ((auStack_40[0] & 4) == 0) {
                    iStack_34 = 0;
                    iVar7 = 0;
                    if (*(char *)(DAT_8006d6d8 + param_1 + 0x178) != '\x02') {
                      iVar7 = func_0x80129ebc();
                    }
                    iVar9 = sStack_42 * 0xc + *(int *)(iVar12 + 0x24);
                    sVar3 = (short)iVar7;
                    if (*(short *)(iVar9 + 2) != 0) {
                      iVar11 = (int)(((uint)*(ushort *)(iVar9 + 8) - (uint)*(ushort *)(iVar9 + 4)) *
                                    0x10000) >> 0x10;
                      iVar9 = FUN_80022044((int)sStack_84,iVar11 << 0xc);
                      RStack_80.w = (short)(iVar9 >> 0xc);
                      RStack_80.x = ((short)(iStack_90 >> 0xc) - (short)(RStack_80.w - iVar11 >> 1))
                                    + *(short *)(sStack_42 * 0xc + *(int *)(iVar12 + 0x24) + 4);
                      iVar9 = sStack_42 * 0xc + *(int *)(iVar12 + 0x24);
                      iVar11 = (int)(((uint)*(ushort *)(iVar9 + 10) - (uint)*(ushort *)(iVar9 + 6))
                                    * 0x10000) >> 0x10;
                      iVar9 = FUN_80022044((int)sStack_82,iVar11 << 0xc);
                      RStack_80.h = (short)(iVar9 >> 0xc);
                      RStack_80.y = ((short)(iStack_8c >> 0xc) - (short)(RStack_80.h - iVar11 >> 1))
                                    + *(short *)(sStack_42 * 0xc + *(int *)(iVar12 + 0x24) + 6);
                      iVar9 = FUN_80022044((int)sStack_84,(int)sStack_88 << 0xc);
                      RStack_80.x = RStack_80.x + (short)(iVar9 >> 0xc);
                      iVar9 = FUN_80022044((int)sStack_82,(int)sStack_86 << 0xc);
                      pDVar4 = DAT_800ab3e0;
                      iVar9 = (uint)(ushort)RStack_80.y + (iVar9 >> 0xc);
                      RStack_80.y = (short)iVar9;
                      if (RStack_80.x < 0) {
                        if (((0x140 - iVar7 < (int)RStack_80.x + (int)RStack_80.w) &&
                            (iVar9 = iVar9 * 0x10000 >> 0x10, iVar9 < 0)) &&
                           (0xf0 - iVar7 < iVar9 + RStack_80.h)) goto LAB_8002946c;
                        if ((RStack_80.x < 0) && ((int)RStack_80.x + (int)RStack_80.w < 0))
                        goto LAB_800297b8;
                      }
                      if (((0x140 < RStack_80.x) &&
                          (0x140 - iVar7 < (int)RStack_80.x + (int)RStack_80.w)) ||
                         (((RStack_80.y < 0 && ((int)RStack_80.y + (int)RStack_80.h < 0)) ||
                          ((0xf0 < RStack_80.y &&
                           (0xf0 - iVar7 < (int)RStack_80.y + (int)RStack_80.h))))))
                      goto LAB_800297b8;
                      if (RStack_80.x < 0) {
                        RStack_80.w = RStack_80.w + RStack_80.x;
                        RStack_80.x = 0;
                      }
                      if (RStack_80.y < 0) {
                        RStack_80.h = RStack_80.h + RStack_80.y;
                        RStack_80.y = 0;
                      }
                      if (((int)RStack_80.x < 0x140 - iVar7) && ((int)RStack_80.y < 0xf0 - iVar7)) {
                        if (0x140 - iVar7 < (int)RStack_80.x + (int)RStack_80.w) {
                          RStack_80.w = (0x140 - RStack_80.x) - sVar3;
                        }
                        if (0xf0 - iVar7 < (int)RStack_80.y + (int)RStack_80.h) {
                          RStack_80.h = (0xf0 - RStack_80.y) - sVar3;
                        }
                        iStack_34 = 1;
                        RStack_78.x = 0;
                        RStack_78.y = 0;
                        RStack_78.w = 0x140 - sVar3;
                        RStack_78.h = 0xf0 - sVar3;
                        DAT_800ab3e0 = DAT_800ab3e0 + 1;
                        pDVar8 = GsSetClip2(&RStack_78);
                        SetDrawEnv(pDVar4,pDVar8);
                        AddPrim((void *)(*(int *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                                  *(int *)(DAT_8006d6d8 +
                                                           *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4) +
                                                 4) + 4),pDVar4);
                      }
                    }
LAB_8002946c:
                    iVar9 = *(short *)(sStack_42 * 0xc + *(int *)(iVar12 + 0x24)) * 8 +
                            *(int *)(iVar12 + 0x20);
                    sVar1 = *(short *)(iVar9 + 4);
                    sVar2 = *(short *)(iVar9 + 6);
                    FUN_80029d54(iVar9,iVar12);
                    iVar7 = (int)sVar1 + (int)sVar2 + -1;
                    while (*(short *)(iVar9 + 4) <= iVar7) {
                      puVar10 = (ushort *)(iVar7 * 0x1c + *(int *)(iVar12 + 0x1c));
                      if (*puVar10 == 0) {
                        FUN_8002a3ac(puVar10,iVar12,iVar6,param_1,&iStack_90);
                        iVar7 = iVar7 + -1;
                      }
                      else {
                        if (*puVar10 - 1 < 2) {
                          FUN_8002a7bc(puVar10,iVar12,iVar6,&iStack_90,(short)*puVar10 + -1);
                        }
                        iVar7 = iVar7 + -1;
                      }
                    }
                    FUN_8002a97c(param_1,0,&iStack_90);
                    while (uVar5 = *(short *)(DAT_8006d6d8 + 0x2c) - 1,
                          *(ushort *)(DAT_8006d6d8 + 0x2c) = uVar5, -1 < (int)((uint)uVar5 << 0x10))
                    {
                      GsSortSprite((GsSPRITE *)
                                   (*(short *)(DAT_8006d6d8 + 0x2c) * 0x24 +
                                   *(int *)(DAT_8006d6d8 + 0x28)),
                                   (GsOT *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                           *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4
                                                   + 4)),1);
                    }
                    FUN_8002a97c(param_1,1,&iStack_90);
                    pDVar4 = DAT_800ab3e0;
                    if ((*(short *)(sStack_42 * 0xc + *(int *)(iVar12 + 0x24) + 2) == 0) ||
                       (iStack_34 != 1)) {
                      RStack_78.x = 0;
                      RStack_78.y = 0;
                      RStack_78.w = 0x140 - sVar3;
                      RStack_78.h = 0xf0 - sVar3;
                      DAT_800ab3e0 = DAT_800ab3e0 + 1;
                      pDVar8 = GsSetClip2(&RStack_78);
                      SetDrawEnv(pDVar4,pDVar8);
                      AddPrim((void *)(*(int *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                                *(int *)(DAT_8006d6d8 +
                                                         *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4) + 4)
                                      + 4),pDVar4);
                    }
                    else {
                      DAT_800ab3e0 = DAT_800ab3e0 + 1;
                      pDVar8 = GsSetClip2(&RStack_80);
                      SetDrawEnv(pDVar4,pDVar8);
                      AddPrim((void *)(*(int *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                                *(int *)(DAT_8006d6d8 +
                                                         *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4) + 4)
                                      + 4),pDVar4);
                    }
                    FUN_80045a68(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                 *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4));
                    iVar6 = DAT_8006d6d8;
                    iVar7 = *(int *)(DAT_8006d6d8 + 0x20) + 1;
                    *(int *)(DAT_8006d6d8 + 0x20) = iVar7;
                    if (*(short *)(iVar6 + *(int *)(iVar6 + 0x1c) * 2 + 0x24) <= iVar7) {
                      *(undefined4 *)(iVar6 + 0x20) = 0;
                    }
                    FUN_80029f1c();
                  }
                  else if (*(char *)(DAT_8006d6d8 + param_1 + 0x178) == '\x02') {
                    FUN_80029ff0((int)sStack_42,iVar6,param_1,param_2,&iStack_90);
                    FUN_80045a68(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                                 *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4));
                    iVar6 = DAT_8006d6d8;
                    iVar7 = *(int *)(DAT_8006d6d8 + 0x20) + 1;
                    *(int *)(DAT_8006d6d8 + 0x20) = iVar7;
                    if (*(short *)(iVar6 + *(int *)(iVar6 + 0x1c) * 2 + 0x24) <= iVar7) {
                      *(undefined4 *)(iVar6 + 0x20) = 0;
                    }
                  }
                }
              }
            }
            else if (*puVar10 == 6) {
              FUN_8002b0f0(puVar10,iVar12,iVar13,auStack_48);
            }
            else {
              FUN_8002aff0(puVar10,iVar12,iVar13,auStack_46,auStack_44);
            }
LAB_800297b8:
            iVar14 = iVar14 + -1;
          } while (psStack_38[2] <= iVar14);
        }
        uVar5 = *(ushort *)(DAT_8006d6d8 + param_1 * 2 + 0x174);
        if (((((uVar5 & 4) == 0) && ((uVar5 & 8) == 0)) && ((uVar5 & 2) == 0)) && ((uVar5 & 1) == 0)
           ) {
          iVar13 = (iVar13 + 1) * 0x10000 >> 0x10;
        }
        if (*psStack_38 <= iVar13) {
          uStack_3c = 1;
        }
      }
    }
    FUN_8002889c();
  }
  else {
    FUN_8002889c();
    uStack_3c = 0;
  }
  return uStack_3c;
}


/* 80029870 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_80029870(int param_1)

{
  undefined4 uVar1;
  int iVar2;
  int *piVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  uint auStack_30 [4];
  
  auStack_30[0] = _UNK_8006d704;
  auStack_30[1] = _UNK_8006d708;
  auStack_30[2] = _UNK_8006d70c;
  auStack_30[3] = _UNK_8006d710;
  if (param_1 == 0) {
    iVar8 = 0x14;
  }
  else {
    iVar8 = 0;
    if (param_1 != 1) {
      iVar2 = 0;
      iVar7 = DAT_8006d6d8 + 4;
      iVar6 = DAT_8006d6d8 + 0xc;
      iVar5 = DAT_8006d6d8 + 0x14;
      iVar4 = DAT_8006d6d8 + 0x24;
      do {
        *(undefined4 *)(iVar7 + iVar2) = 0;
        *(undefined4 *)(iVar6 + iVar2) = 0;
        *(undefined4 *)(iVar5 + iVar2) = 0;
        *(undefined2 *)(iVar4 + iVar8 * 2) = 0;
        iVar8 = iVar8 + 1;
        iVar2 = iVar8 * 4;
      } while (iVar8 < 2);
      *(undefined4 *)(DAT_8006d6d8 + 0x20) = 0;
      return 0;
    }
    iVar8 = 0x1e;
  }
  iVar2 = 0;
  do {
    iVar4 = FUN_8002dec4(iVar8 * 0x14);
    *(int *)(DAT_8006d6d8 + iVar2 * 4 + 4) = iVar4;
    if (iVar4 == 0) {
      return 0;
    }
    iVar4 = FUN_8002dec4(iVar8 << 2);
    *(int *)(DAT_8006d6d8 + iVar2 * 4 + 0xc) = iVar4;
    if (iVar4 == 0) {
      return 0;
    }
    iVar4 = FUN_8002dec4(iVar8 << 2);
    *(int *)(DAT_8006d6d8 + iVar2 * 4 + 0x14) = iVar4;
    if (iVar4 == 0) {
      return 0;
    }
    iVar4 = 0;
    if (iVar8 != 0) {
      do {
        uVar1 = FUN_8002dec4(4 << (auStack_30[param_1] & 0x1f));
        piVar3 = (int *)(DAT_8006d6d8 + 0xc + iVar2 * 4);
        iVar5 = iVar4 * 4;
        *(undefined4 *)(iVar5 + *piVar3) = uVar1;
        iVar4 = iVar4 + 1;
        if (*(int *)(iVar5 + *piVar3) == 0) {
          return 0;
        }
      } while (iVar4 < iVar8);
    }
    iVar4 = 0;
    if (iVar8 != 0) {
      do {
        uVar1 = FUN_8002dec4(auStack_30[param_1 + 2]);
        piVar3 = (int *)(DAT_8006d6d8 + 0x14 + iVar2 * 4);
        iVar5 = iVar4 * 4;
        *(undefined4 *)(iVar5 + *piVar3) = uVar1;
        iVar4 = iVar4 + 1;
        if (*(int *)(iVar5 + *piVar3) == 0) {
          return 0;
        }
      } while (iVar4 < iVar8);
    }
    iVar4 = 0;
    if (iVar8 != 0) {
      piVar3 = (int *)(DAT_8006d6d8 + 4 + iVar2 * 4);
      iVar5 = DAT_8006d6d8 + 0xc;
      do {
        *(uint *)(iVar4 * 0x14 + *piVar3) = auStack_30[param_1];
        *(undefined4 *)(iVar4 * 0x14 + *piVar3 + 4) =
             *(undefined4 *)(iVar4 * 4 + *(int *)(iVar5 + iVar2 * 4));
        iVar4 = iVar4 + 1;
      } while (iVar4 < iVar8);
    }
    *(short *)(DAT_8006d6d8 + iVar2 * 2 + 0x24) = (short)iVar8;
    iVar2 = iVar2 + 1;
  } while (iVar2 < 2);
  *(undefined4 *)(DAT_8006d6d8 + 0x20) = 0;
  return 1;
}


/* 80029d54 */

void FUN_80029d54(int param_1,int param_2)

{
  short sVar1;
  int iVar2;
  undefined4 uVar3;
  short *psVar4;
  int iVar5;
  int iVar6;
  
  iVar5 = DAT_8006d6d8;
  *(undefined2 *)(DAT_8006d6d8 + 0x46) = 0;
  *(undefined2 *)(iVar5 + 0x44) = 0;
  *(undefined2 *)(iVar5 + 0x2c) = 0;
  *(undefined2 *)(iVar5 + 0x4a) = 0;
  *(undefined2 *)(iVar5 + 0x48) = 0;
  *(undefined2 *)(iVar5 + 0x2e) = 0;
  iVar2 = DAT_8006d6d8;
  iVar5 = (int)*(short *)(param_1 + 4);
  iVar6 = iVar5 + *(short *)(param_1 + 6);
  for (; iVar5 < iVar6; iVar5 = iVar5 + 1) {
    psVar4 = (short *)(iVar5 * 0x1c + *(int *)(param_2 + 0x1c));
    sVar1 = *psVar4;
    if (sVar1 == 0) {
      *(short *)(iVar2 + 0x2e) = *(short *)(iVar2 + 0x2e) + 1;
    }
    else if (sVar1 == 1) {
      *(short *)(iVar2 + 0x48) = *(short *)(iVar2 + 0x48) + 1;
    }
    else if (*psVar4 == 2) {
      *(short *)(iVar2 + 0x4a) = *(short *)(iVar2 + 0x4a) + 1;
    }
  }
  if (*(short *)(DAT_8006d6d8 + 0x2e) == 0) {
    *(undefined4 *)(DAT_8006d6d8 + 0x28) = 0;
  }
  else {
    uVar3 = FUN_8002dec4(*(short *)(DAT_8006d6d8 + 0x2e) * 0x24);
    *(undefined4 *)(DAT_8006d6d8 + 0x28) = uVar3;
  }
  iVar5 = DAT_8006d6d8;
  if (*(short *)(DAT_8006d6d8 + 0x48) == 0) {
    *(undefined4 *)(DAT_8006d6d8 + 0x30) = 0;
    *(undefined4 *)(iVar5 + 0x38) = 0;
  }
  else {
    uVar3 = FUN_8002dec4((int)*(short *)(DAT_8006d6d8 + 0x48) << 3);
    iVar5 = DAT_8006d6d8;
    *(undefined4 *)(DAT_8006d6d8 + 0x30) = uVar3;
    uVar3 = FUN_8002dec4((int)*(short *)(iVar5 + 0x48) << 2);
    *(undefined4 *)(DAT_8006d6d8 + 0x38) = uVar3;
  }
  iVar5 = DAT_8006d6d8;
  if (*(short *)(DAT_8006d6d8 + 0x4a) == 0) {
    *(undefined4 *)(DAT_8006d6d8 + 0x34) = 0;
    *(undefined4 *)(iVar5 + 0x3c) = 0;
  }
  else {
    uVar3 = FUN_8002dec4((int)*(short *)(DAT_8006d6d8 + 0x4a) << 3);
    iVar5 = DAT_8006d6d8;
    *(undefined4 *)(DAT_8006d6d8 + 0x34) = uVar3;
    uVar3 = FUN_8002dec4((int)*(short *)(iVar5 + 0x4a) << 2);
    *(undefined4 *)(DAT_8006d6d8 + 0x3c) = uVar3;
  }
  return;
}


/* 80029f1c */

void FUN_80029f1c(void)

{
  int iVar1;
  
  if (*(int *)(DAT_8006d6d8 + 0x3c) != 0) {
    FUN_8002dfe4();
  }
  iVar1 = DAT_8006d6d8;
  *(undefined4 *)(DAT_8006d6d8 + 0x3c) = 0;
  if (*(int *)(iVar1 + 0x34) != 0) {
    FUN_8002dfe4();
  }
  iVar1 = DAT_8006d6d8;
  *(undefined4 *)(DAT_8006d6d8 + 0x34) = 0;
  if (*(int *)(iVar1 + 0x38) != 0) {
    FUN_8002dfe4();
  }
  iVar1 = DAT_8006d6d8;
  *(undefined4 *)(DAT_8006d6d8 + 0x38) = 0;
  if (*(int *)(iVar1 + 0x30) != 0) {
    FUN_8002dfe4();
  }
  iVar1 = DAT_8006d6d8;
  *(undefined4 *)(DAT_8006d6d8 + 0x30) = 0;
  if (*(int *)(iVar1 + 0x28) != 0) {
    FUN_8002dfe4();
  }
  *(undefined4 *)(DAT_8006d6d8 + 0x28) = 0;
  return;
}


/* 80029ff0 */

void FUN_80029ff0(short param_1,short param_2,int param_3,int param_4,int *param_5)

{
  ushort uVar1;
  short sVar2;
  ushort *puVar3;
  int iVar4;
  
  FUN_8001aad4(DAT_8006d6d8 + 0x4c,
               (int)param_1 +
               *(int *)(&UNK_800657cc +
                       *(int *)(DAT_8006d6d8 + 0x17c) * 4 + *(int *)(DAT_8006d6d8 + 0x184) * 0x48));
  FUN_8001ac7c(DAT_8006d6d8 + 0x4c,0);
  FUN_8001abc0(DAT_8006d6d8 + 0x4c,(*param_5 << 4) >> 0x10,(param_5[1] << 4) >> 0x10);
  FUN_8001ac2c(DAT_8006d6d8 + 0x4c,0);
  FUN_8001abec(DAT_8006d6d8 + 0x4c,1,0);
  FUN_8001ac10(DAT_8006d6d8 + 0x4c,3);
  iVar4 = 0;
  sVar2 = 0;
  if (0 < param_2) {
    do {
      func_0x8001ad94(DAT_8006d6d8 + 0x4c);
      sVar2 = func_0x8001ac98(DAT_8006d6d8 + 0x4c);
      if (sVar2 == 1) {
        if (*(char *)(*(int *)(DAT_8006d6d8 + param_3 * 0x1c + 0x11c) + param_4) == '\0') {
          puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_3 * 2);
          *puVar3 = *puVar3 | 8;
          break;
        }
        func_0x8001ace4(DAT_8006d6d8 + 0x4c);
        puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_3 * 2);
        *puVar3 = *puVar3 & 0xfff7;
      }
      else if (sVar2 == 4) {
        if (*(char *)(*(int *)(DAT_8006d6d8 + param_3 * 0x1c + 0x118) + param_4) == '\0') {
          puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_3 * 2);
          *puVar3 = *puVar3 | 4;
        }
        break;
      }
      iVar4 = iVar4 + 1;
    } while (iVar4 < param_2);
  }
  func_0x8001b0b4(DAT_8006d6d8 + 0x4c,
                  *(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                  *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4),0);
  if (sVar2 == 1) {
    if ((*(ushort *)(DAT_8006d6d8 + param_3 * 2 + 0x174) & 1) == 0) {
      FUN_80022c90(0x122,0xcf,0,
                   *(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                   *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4),1);
    }
  }
  else if (sVar2 == 4) {
    puVar3 = (ushort *)(DAT_8006d6d8 + 0x174 + param_3 * 2);
    uVar1 = *puVar3;
    if ((uVar1 & 4) != 0) {
      if (*(char *)(*(int *)(DAT_8006d6d8 + param_3 * 0x1c + 0x118) + param_4) == '\0') {
        if ((*(ushort *)(DAT_8006d6d8 + param_3 * 2 + 0x174) & 1) == 0) {
          FUN_80022c90(0x122,0xcf,0,
                       *(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                       *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4),1);
        }
      }
      else {
        *puVar3 = uVar1 & 0xfffb;
      }
    }
  }
  return;
}


/* 8002a3ac */

void FUN_8002a3ac(undefined4 param_1,undefined4 param_2,short param_3,int param_4,int *param_5)

{
  undefined2 uVar1;
  int iVar2;
  undefined4 uVar3;
  int iVar4;
  uint uVar5;
  int iVar6;
  uint *puVar7;
  int *piVar8;
  uint *puVar9;
  uint uVar10;
  uint uVar11;
  uint *puVar12;
  int iVar13;
  int iStack_70;
  int iStack_6c;
  short sStack_68;
  short sStack_66;
  short sStack_64;
  short sStack_62;
  int iStack_60;
  int iStack_5c;
  int iStack_40;
  undefined1 uStack_38;
  undefined1 uStack_37;
  undefined1 uStack_36;
  short sStack_30;
  ushort auStack_2e [3];
  
  iVar13 = (int)param_3;
  FUN_8002af18(param_1,param_2,iVar13,&sStack_30,&sStack_68,auStack_2e);
  if (sStack_30 == -1) {
    return;
  }
  iVar2 = FUN_8002b1d4(param_1,param_2,iVar13,&iStack_60);
  if (iVar2 == 0) {
    return;
  }
  puVar12 = (uint *)(sStack_30 * 0x24 + *(int *)(DAT_8006d6d8 + param_4 * 4 + 0x94));
  if (iStack_40 == -1) {
    iStack_70 = iStack_60;
    iStack_6c = iStack_5c;
  }
  else {
    FUN_80021e90(&iStack_60,&iStack_70,3);
  }
  *puVar12 = *puVar12 & 0x8fffffff;
  uVar3 = FUN_8002b880(param_1,param_2,iVar13);
  switch(uVar3) {
  default:
    goto LAB_8002a52c;
  case 1:
    uVar5 = *puVar12;
    uVar10 = 0x40000000;
    break;
  case 2:
    uVar5 = *puVar12;
    uVar10 = 0x50000000;
    break;
  case 3:
    uVar5 = *puVar12;
    uVar10 = 0x60000000;
    break;
  case 4:
    uVar5 = *puVar12;
    uVar10 = 0x70000000;
  }
  *puVar12 = uVar5 | uVar10;
LAB_8002a52c:
  FUN_8002b914(param_1,param_2,iVar13,&uStack_38);
  *(undefined1 *)(puVar12 + 5) = uStack_38;
  *(undefined1 *)((int)puVar12 + 0x15) = uStack_37;
  *(undefined1 *)((int)puVar12 + 0x16) = uStack_36;
  FUN_8002b57c(param_1,param_2,iVar13,&sStack_64);
  uVar1 = FUN_80022044((int)(short)param_5[3],(int)sStack_64);
  *(undefined2 *)(puVar12 + 7) = uVar1;
  uVar1 = FUN_80022044((int)*(short *)((int)param_5 + 0xe),(int)sStack_62);
  *(undefined2 *)((int)puVar12 + 0x1e) = uVar1;
  iVar2 = FUN_80022044((int)(short)param_5[3],(int)(short)param_5[2] << 0xc);
  iVar4 = FUN_80022044((int)*(short *)((int)param_5 + 0xe),(int)*(short *)((int)param_5 + 10) << 0xc
                      );
  iVar6 = param_5[1];
  *(short *)(puVar12 + 1) = (short)(iVar2 + *param_5 >> 0xc);
  *(short *)((int)puVar12 + 6) = (short)(iVar4 + iVar6 >> 0xc);
  iVar2 = FUN_80022044((int)sStack_64,(int)sStack_68 << 0xc);
  iVar4 = FUN_80022044((int)sStack_62,(int)sStack_66 << 0xc);
  iVar4 = iVar4 + iStack_6c;
  iVar2 = FUN_80022044((int)(short)param_5[3],iVar2 + iStack_70);
  iVar4 = FUN_80022044((int)*(short *)((int)param_5 + 0xe),iVar4);
  *(short *)(puVar12 + 1) = (short)puVar12[1] + (short)(iVar2 >> 0xc);
  *(short *)((int)puVar12 + 6) = *(short *)((int)puVar12 + 6) + (short)(iVar4 >> 0xc);
  iVar13 = FUN_8002bbb0(param_1,param_2,(int)sStack_30,iVar13);
  piVar8 = (int *)(DAT_8006d6d8 + 0x9c + param_4 * 4);
  *(undefined2 *)(puVar12 + 4) = *(undefined2 *)(iVar13 * 4 + *piVar8);
  *(undefined2 *)((int)puVar12 + 0x12) = *(undefined2 *)(iVar13 * 4 + *piVar8 + 2);
  uVar5 = *puVar12;
  *puVar12 = uVar5 & 0xff3fffff;
  if ((auStack_2e[0] & 1) != 0) {
    *puVar12 = uVar5 & 0xff3fffff | 0x800000;
  }
  if ((auStack_2e[0] & 2) != 0) {
    *puVar12 = *puVar12 | 0x400000;
  }
  puVar7 = (uint *)(*(short *)(DAT_8006d6d8 + 0x2c) * 0x24 + *(int *)(DAT_8006d6d8 + 0x28));
  puVar9 = puVar12 + 8;
  do {
    uVar5 = puVar12[1];
    uVar10 = puVar12[2];
    uVar11 = puVar12[3];
    *puVar7 = *puVar12;
    puVar7[1] = uVar5;
    puVar7[2] = uVar10;
    puVar7[3] = uVar11;
    puVar12 = puVar12 + 4;
    puVar7 = puVar7 + 4;
  } while (puVar12 != puVar9);
  *puVar7 = *puVar12;
  *(short *)(DAT_8006d6d8 + 0x2c) = *(short *)(DAT_8006d6d8 + 0x2c) + 1;
  return;
}


/* 8002a7bc */

void FUN_8002a7bc(undefined4 param_1,undefined4 param_2,short param_3,int param_4,int param_5)

{
  undefined2 uVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  short *psVar6;
  int *piVar7;
  int iVar8;
  int iStack_50;
  int iStack_4c;
  int iStack_30;
  
  iVar8 = (int)param_3;
  iVar2 = FUN_8002b1d4(param_1,param_2,iVar8,&iStack_50);
  if (iVar2 != 0) {
    iVar2 = DAT_8006d6d8 + param_5 * 4;
    iVar5 = (int)*(short *)(DAT_8006d6d8 + param_5 * 2 + 0x44);
    piVar7 = (int *)(iVar5 * 8 + *(int *)(iVar2 + 0x30));
    iVar2 = *(int *)(iVar2 + 0x38);
    if (iStack_30 == -1) {
      *piVar7 = iStack_50;
      piVar7[1] = iStack_4c;
    }
    else {
      FUN_80021e90(&iStack_50,piVar7,3);
    }
    if (param_5 == 1) {
      iVar3 = FUN_80022044((int)*(short *)(param_4 + 0xc),*piVar7);
      *piVar7 = iVar3;
      iVar3 = FUN_80022044((int)*(short *)(param_4 + 0xe),piVar7[1]);
      piVar7[1] = iVar3;
    }
    iVar3 = FUN_80022044((int)*(short *)(param_4 + 0xc),(int)*(short *)(param_4 + 8) << 0xc);
    iVar4 = FUN_80022044((int)*(short *)(param_4 + 0xe),(int)*(short *)(param_4 + 10) << 0xc);
    *piVar7 = iVar3 + *piVar7;
    piVar7[1] = iVar4 + piVar7[1];
    FUN_8002b914(param_1,param_2,iVar8,iVar5 * 4 + iVar2);
    uVar1 = FUN_8002b880(param_1,param_2,iVar8);
    iVar2 = DAT_8006d6d8;
    *(undefined2 *)(DAT_8006d6d8 + param_5 * 2 + 0x40) = uVar1;
    psVar6 = (short *)(iVar2 + 0x44 + param_5 * 2);
    *psVar6 = *psVar6 + 1;
  }
  return;
}


/* 8002a97c */

void FUN_8002a97c(undefined4 param_1,short param_2,int *param_3)

{
  short sVar1;
  DR_MODE *pDVar2;
  undefined1 *puVar3;
  int iVar4;
  int iVar5;
  undefined1 *puVar6;
  int *piVar7;
  int iVar8;
  int iVar9;
  undefined1 auStack_60 [3];
  undefined1 uStack_5d;
  undefined1 uStack_5c;
  undefined1 uStack_5b;
  undefined1 uStack_5a;
  undefined1 uStack_59;
  undefined2 uStack_58;
  undefined2 uStack_56;
  undefined1 uStack_54;
  undefined1 uStack_53;
  undefined1 uStack_52;
  undefined2 uStack_50;
  undefined2 uStack_4e;
  undefined1 uStack_4c;
  undefined1 uStack_4b;
  undefined1 uStack_4a;
  undefined2 uStack_48;
  undefined2 uStack_46;
  undefined1 auStack_40 [3];
  undefined1 uStack_3d;
  undefined1 uStack_3c;
  undefined1 uStack_3b;
  undefined1 uStack_3a;
  undefined1 uStack_39;
  undefined2 uStack_38;
  undefined2 uStack_36;
  undefined1 uStack_34;
  undefined1 uStack_33;
  undefined2 uStack_30;
  undefined2 uStack_2e;
  undefined1 uStack_2c;
  undefined1 uStack_2b;
  undefined2 uStack_2a;
  undefined2 uStack_28;
  undefined2 uStack_26;
  undefined1 uStack_24;
  undefined1 uStack_23;
  
  pDVar2 = DAT_800ab3e0;
  iVar9 = (int)param_2;
  iVar8 = (int)*(short *)(DAT_8006d6d8 + iVar9 * 2 + 0x44);
  if (iVar8 < 3) {
    return;
  }
  iVar4 = DAT_8006d6d8 + iVar9 * 4;
  piVar7 = *(int **)(iVar4 + 0x30);
  puVar6 = *(undefined1 **)(iVar4 + 0x38);
  sVar1 = *(short *)(DAT_8006d6d8 + iVar9 * 2 + 0x40);
  DAT_800ab3e0 = DAT_800ab3e0 + 1;
  SetDrawMode(pDVar2,0,0,0,(RECT *)0x0);
  AddPrim((void *)(*(int *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                            *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4) + 4) + 4)
          ,pDVar2);
  uStack_5d = 6;
  uStack_3d = 7;
  uStack_39 = 0x24;
  uStack_3c = 0x80;
  uStack_3b = 0x80;
  uStack_3a = 0x80;
  uStack_38 = 0;
  uStack_36 = 0;
  uStack_30 = 0;
  uStack_2e = 0;
  uStack_28 = 0;
  uStack_26 = 0;
  uStack_34 = 0;
  uStack_33 = 0;
  uStack_2c = 0;
  uStack_2b = 0;
  uStack_24 = 0;
  uStack_23 = 0;
  if (sVar1 == 0) {
    uStack_59 = 0x30;
  }
  else {
    uStack_59 = 0x32;
  }
  if (iVar8 == 3) {
    iVar4 = *param_3;
    uStack_58 = (undefined2)(*piVar7 + iVar4 >> 0xc);
    iVar8 = param_3[1];
    uStack_56 = (undefined2)(piVar7[1] + iVar8 >> 0xc);
    uStack_5c = *puVar6;
    uStack_5b = puVar6[1];
    uStack_5a = puVar6[2];
    uStack_50 = (undefined2)(piVar7[2] + iVar4 >> 0xc);
    uStack_4e = (undefined2)(piVar7[3] + iVar8 >> 0xc);
    uStack_54 = puVar6[4];
    uStack_53 = puVar6[5];
    uStack_52 = puVar6[6];
    uStack_48 = (undefined2)(piVar7[4] + iVar4 >> 0xc);
    uStack_46 = (undefined2)(piVar7[5] + iVar8 >> 0xc);
    uStack_4c = puVar6[8];
    uStack_4b = puVar6[9];
    uStack_4a = puVar6[10];
    GsSortPoly(auStack_60,
               (GsOT *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                       *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4)),1);
  }
  else {
    iVar4 = (iVar8 + -1) * 0x10000 >> 0x10;
    uStack_58 = (undefined2)(piVar7[iVar4 * 2] + *param_3 >> 0xc);
    uStack_56 = (undefined2)((piVar7 + iVar4 * 2)[1] + param_3[1] >> 0xc);
    puVar3 = puVar6 + iVar4 * 4;
    uStack_5c = *puVar3;
    uStack_5b = puVar3[1];
    uStack_5a = puVar3[2];
    iVar8 = 0;
    if (-1 < iVar4) {
      iVar5 = 0;
      do {
        uStack_50 = (undefined2)(*(int *)(iVar5 + (int)piVar7) + *param_3 >> 0xc);
        uStack_4e = (undefined2)(((int *)(iVar5 + (int)piVar7))[1] + param_3[1] >> 0xc);
        puVar3 = puVar6 + iVar8 * 4;
        uStack_54 = *puVar3;
        uStack_53 = puVar3[1];
        uStack_52 = puVar3[2];
        iVar8 = iVar8 + 1;
        uStack_48 = (undefined2)(piVar7[iVar8 * 2] + *param_3 >> 0xc);
        uStack_46 = (undefined2)((piVar7 + iVar8 * 2)[1] + param_3[1] >> 0xc);
        puVar3 = puVar6 + iVar8 * 4;
        uStack_4c = *puVar3;
        uStack_4b = puVar3[1];
        uStack_4a = puVar3[2];
        GsSortPoly(auStack_60,
                   (GsOT *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                           *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4)),1);
        iVar5 = iVar8 * 8;
      } while (iVar8 <= iVar4);
    }
  }
  switch(*(undefined2 *)(DAT_8006d6d8 + iVar9 * 2 + 0x40)) {
  default:
    goto LAB_8002ae7c;
  case 1:
    uStack_2a = 0;
    break;
  case 2:
    uStack_2a = 0x20;
    break;
  case 3:
    uStack_2a = 0x40;
    break;
  case 4:
    uStack_2a = 0x60;
    GsSortPoly(auStack_40,
               (GsOT *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                       *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4)),1);
    goto LAB_8002ae7c;
  }
  GsSortPoly(auStack_40,
             (GsOT *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                     *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4)),1);
LAB_8002ae7c:
  pDVar2 = DAT_800ab3e0;
  DAT_800ab3e0 = DAT_800ab3e0 + 1;
  SetDrawMode(pDVar2,0,1,0,(RECT *)0x0);
  AddPrim((void *)(*(int *)(*(int *)(DAT_8006d6d8 + 0x20) * 0x14 +
                            *(int *)(DAT_8006d6d8 + *(int *)(DAT_8006d6d8 + 0x1c) * 4 + 4) + 4) + 4)
          ,pDVar2);
  return;
}


/* 8002af18 */

int FUN_8002af18(int param_1,int param_2,short param_3,undefined2 *param_4,uint param_5,
                undefined2 *param_6)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  uint *puVar4;
  int iVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  
  iVar5 = (int)*(short *)(param_1 + 4);
  iVar6 = iVar5 + *(short *)(param_1 + 6);
  iVar8 = iVar5;
  if (iVar5 < iVar6) {
    do {
      if ((int)param_3 < (int)*(short *)(iVar5 * 0xc + *(int *)(param_2 + 4))) {
        iVar5 = iVar6;
      }
      else {
        iVar8 = iVar5;
      }
      iVar5 = iVar5 + 1;
    } while (iVar5 < iVar6);
  }
  iVar6 = iVar8 * 0xc;
  *param_4 = *(undefined2 *)(iVar6 + *(int *)(param_2 + 4) + 2);
  iVar5 = iVar6 + *(int *)(param_2 + 4);
  uVar1 = iVar5 + 0xb;
  uVar2 = uVar1 & 3;
  uVar7 = iVar5 + 8;
  uVar3 = uVar7 & 3;
  uVar7 = (*(int *)(uVar1 - uVar2) << (3 - uVar2) * 8 |
          (int)param_3 & 0xffffffffU >> (uVar2 + 1) * 8) & -1 << (4 - uVar3) * 8 |
          *(uint *)(uVar7 - uVar3) >> uVar3 * 8;
  uVar1 = param_5 + 3 & 3;
  puVar4 = (uint *)((param_5 + 3) - uVar1);
  *puVar4 = *puVar4 & -1 << (uVar1 + 1) * 8 | uVar7 >> (3 - uVar1) * 8;
  uVar1 = param_5 & 3;
  *(uint *)(param_5 - uVar1) =
       *(uint *)(param_5 - uVar1) & 0xffffffffU >> (4 - uVar1) * 8 | uVar7 << uVar1 * 8;
  *param_6 = *(undefined2 *)(iVar6 + *(int *)(param_2 + 4) + 4);
  return (int)(short)iVar8;
}


/* 8002aff0 */

undefined4
FUN_8002aff0(int param_1,int param_2,short param_3,undefined2 *param_4,undefined2 *param_5)

{
  int iVar1;
  int iVar2;
  int iVar3;
  undefined4 uVar4;
  
  iVar2 = (int)*(short *)(param_1 + 4);
  iVar1 = iVar2 + *(short *)(param_1 + 6);
  uVar4 = 0;
  iVar3 = iVar2;
  if (iVar2 < iVar1) {
    if (*(short *)(iVar2 * 0xc + *(int *)(param_2 + 4)) != param_3) {
      do {
        if (param_3 < *(short *)(iVar2 * 0xc + *(int *)(param_2 + 4))) {
          iVar2 = iVar1;
        }
        else {
          iVar3 = iVar2;
        }
        iVar2 = iVar2 + 1;
        if (iVar1 <= iVar2) goto LAB_8002b0ac;
      } while (*(short *)(iVar2 * 0xc + *(int *)(param_2 + 4)) != param_3);
    }
    uVar4 = 1;
    iVar3 = iVar2;
  }
LAB_8002b0ac:
  *param_4 = *(undefined2 *)(iVar3 * 0xc + *(int *)(param_2 + 4) + 2);
  *param_5 = *(undefined2 *)(iVar3 * 0xc + *(int *)(param_2 + 4) + 6);
  return uVar4;
}


/* 8002b0f0 */

undefined4 FUN_8002b0f0(int param_1,int param_2,short param_3,undefined2 *param_4)

{
  int iVar1;
  int iVar2;
  int iVar3;
  undefined4 uVar4;
  
  iVar2 = (int)*(short *)(param_1 + 4);
  iVar1 = iVar2 + *(short *)(param_1 + 6);
  uVar4 = 0;
  iVar3 = iVar2;
  if (iVar2 < iVar1) {
    if (*(short *)(iVar2 * 0xc + *(int *)(param_2 + 4)) != param_3) {
      do {
        if (param_3 < *(short *)(iVar2 * 0xc + *(int *)(param_2 + 4))) {
          iVar2 = iVar1;
        }
        else {
          iVar3 = iVar2;
        }
        iVar2 = iVar2 + 1;
        if (iVar1 <= iVar2) goto LAB_8002b1ac;
      } while (*(short *)(iVar2 * 0xc + *(int *)(param_2 + 4)) != param_3);
    }
    uVar4 = 1;
    iVar3 = iVar2;
  }
LAB_8002b1ac:
  *param_4 = *(undefined2 *)(iVar3 * 0xc + *(int *)(param_2 + 4) + 2);
  return uVar4;
}


/* 8002b1d4 */

undefined4 FUN_8002b1d4(int param_1,int param_2,short param_3,int *param_4)

{
  bool bVar1;
  bool bVar2;
  short *psVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  int iVar11;
  int iVar12;
  int iVar13;
  int iVar14;
  undefined4 uVar15;
  
  iVar8 = (int)param_3;
  uVar15 = 0;
  iVar9 = (int)*(short *)(param_1 + 8);
  iVar6 = iVar9 + *(short *)(param_1 + 10);
  bVar1 = false;
  bVar2 = false;
  iVar5 = iVar9;
  if (iVar9 < iVar6) {
    do {
      if (*(short *)(iVar9 * 0x10 + *(int *)(param_2 + 8)) == iVar8) {
        bVar2 = true;
        bVar1 = true;
        uVar15 = 1;
        iVar4 = iVar6;
        iVar5 = iVar9;
      }
      else {
        iVar4 = iVar9;
        if (*(short *)(iVar9 * 0x10 + *(int *)(param_2 + 8)) < iVar8) {
          bVar1 = true;
          uVar15 = 1;
          iVar5 = iVar9;
        }
      }
      iVar9 = iVar4 + 1;
    } while (iVar9 < iVar6);
  }
  if (!bVar1) {
    return 0;
  }
  iVar9 = iVar5 * 0x10;
  if ((iVar5 + 1 < iVar6) && (iVar6 = iVar9 + *(int *)(param_2 + 8), *(short *)(iVar6 + 0x12) != 0))
  {
    iVar7 = (int)*(short *)(iVar6 + 4) << 0xc;
    *param_4 = iVar7;
    iVar14 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 6) << 0xc;
    param_4[1] = iVar14;
    iVar4 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0xc) << 0xc;
    param_4[2] = iVar4;
    iVar13 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0xe) << 0xc;
    param_4[3] = iVar13;
    iVar12 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0x18) << 0xc;
    param_4[4] = iVar12;
    iVar11 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0x1a) << 0xc;
    param_4[5] = iVar11;
    iVar10 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0x14) << 0xc;
    param_4[6] = iVar10;
    iVar6 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0x16) << 0xc;
    param_4[7] = iVar6;
    if ((((iVar4 != iVar7) || (iVar13 != iVar14)) || (iVar12 != iVar10)) || (iVar11 != iVar6)) {
      if (bVar2) {
        param_4[8] = 0;
        return uVar15;
      }
      psVar3 = (short *)(iVar5 * 0x10 + *(int *)(param_2 + 8));
      iVar6 = (int)*psVar3;
      iVar5 = psVar3[8] - iVar6;
      if (iVar5 == 0) {
        trap(7);
      }
      param_4[8] = ((iVar8 - iVar6) * 0x1000) / iVar5;
      return uVar15;
    }
    if (bVar2) goto LAB_8002b570;
    iVar6 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 4);
    *param_4 = iVar6;
    param_4[1] = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 6);
    iVar4 = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0x14);
    param_4[6] = iVar4;
    param_4[7] = (int)*(short *)(iVar9 + *(int *)(param_2 + 8) + 0x16);
    iVar8 = iVar8 - *(short *)(iVar9 + *(int *)(param_2 + 8));
    param_4[8] = iVar8;
    psVar3 = (short *)(iVar9 + *(int *)(param_2 + 8));
    iVar9 = (int)psVar3[8] - (int)*psVar3;
    iVar8 = (iVar4 - iVar6) * iVar8;
    if (iVar8 == 0) {
      iVar6 = (int)*(short *)(iVar5 * 0x10 + *(int *)(param_2 + 8) + 4);
    }
    else {
      if (iVar9 == 0) {
        trap(7);
      }
      iVar6 = iVar8 / iVar9 + iVar6;
    }
    *param_4 = iVar6 << 0xc;
    iVar8 = (param_4[7] - param_4[1]) * param_4[8];
    if (iVar8 == 0) {
      iVar8 = *(int *)(param_2 + 8);
      iVar5 = iVar5 << 4;
      goto code_r0x8002b558;
    }
    if (iVar9 == 0) {
      trap(7);
    }
    iVar8 = iVar8 / iVar9 + param_4[1];
  }
  else {
    iVar5 = iVar5 * 0x10;
    *param_4 = (int)*(short *)(iVar5 + *(int *)(param_2 + 8) + 4) << 0xc;
    iVar8 = *(int *)(param_2 + 8);
code_r0x8002b558:
    iVar8 = (int)*(short *)(iVar5 + iVar8 + 6);
  }
  param_4[1] = iVar8 << 0xc;
LAB_8002b570:
  param_4[8] = -1;
  return uVar15;
}


/* 8002b57c */

void FUN_8002b57c(int param_1,int param_2,short param_3,short *param_4)

{
  bool bVar1;
  short sVar2;
  short sVar3;
  short sVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  undefined4 uVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  short *psVar11;
  int iVar12;
  
  iVar10 = (int)param_3;
  if (*(short *)(param_1 + 0x16) == 0) {
    sVar2 = 0x1000;
    *param_4 = 0x1000;
  }
  else {
    iVar9 = (int)*(short *)(param_1 + 0x14);
    iVar8 = iVar9 + *(short *)(param_1 + 0x16);
    bVar1 = false;
    iVar12 = iVar9;
    if (iVar9 < iVar8) {
      do {
        if (*(short *)(iVar9 * 0xc + *(int *)(param_2 + 0x14)) == iVar10) {
          bVar1 = true;
          iVar12 = iVar9;
LAB_8002b64c:
          iVar9 = iVar8;
        }
        else {
          if (iVar10 <= *(short *)(iVar9 * 0xc + *(int *)(param_2 + 0x14))) goto LAB_8002b64c;
          iVar12 = iVar9;
        }
        iVar9 = iVar9 + 1;
      } while (iVar9 < iVar8);
    }
    if (iVar12 + 1 < iVar8) {
      iVar9 = iVar12 * 0xc + *(int *)(param_2 + 0x14);
      if (*(short *)(iVar9 + 0xe) != 0) {
        if (bVar1) {
          uVar5 = __mulsf3(*(undefined4 *)(iVar9 + 4),0x45800000);
          sVar2 = __fixsfsi(uVar5);
          *param_4 = sVar2;
          uVar5 = __mulsf3(*(undefined4 *)(iVar12 * 0xc + *(int *)(param_2 + 0x14) + 8),0x45800000);
          sVar2 = __fixsfsi(uVar5);
          param_4[1] = sVar2;
          return;
        }
        iVar12 = iVar12 * 0xc;
        psVar11 = (short *)(iVar12 + *(int *)(param_2 + 0x14));
        iVar9 = (int)psVar11[6] - (int)*psVar11;
        iVar10 = ((iVar10 - *psVar11) * 0x1000) / iVar9;
        if (iVar9 == 0) {
          trap(7);
        }
        uVar5 = __mulsf3(*(undefined4 *)(psVar11 + 8),0x45800000);
        uVar6 = __mulsf3(*(undefined4 *)(psVar11 + 2),0x45800000);
        uVar5 = __subsf3(uVar5,uVar6);
        uVar5 = __fixsfsi(uVar5);
        uVar6 = __mulsf3(*(undefined4 *)(psVar11 + 10),0x45800000);
        uVar7 = __mulsf3(*(undefined4 *)(psVar11 + 4),0x45800000);
        uVar6 = __subsf3(uVar6,uVar7);
        uVar6 = __fixsfsi(uVar6);
        sVar2 = FUN_80022044(iVar10,uVar5);
        sVar3 = FUN_80022044(iVar10,uVar6);
        uVar5 = __mulsf3(*(undefined4 *)(iVar12 + *(int *)(param_2 + 0x14) + 4),0x45800000);
        sVar4 = __fixsfsi(uVar5);
        *param_4 = sVar4 + sVar2;
        uVar5 = __mulsf3(*(undefined4 *)(iVar12 + *(int *)(param_2 + 0x14) + 8),0x45800000);
        sVar2 = __fixsfsi(uVar5);
        sVar2 = sVar2 + sVar3;
        goto LAB_8002b850;
      }
    }
    iVar10 = iVar12 * 0xc + *(int *)(param_2 + 0x14);
    uVar5 = __mulsf3(*(undefined4 *)(iVar10 + 4),0x45800000);
    sVar3 = __fixsfsi(uVar5);
    uVar5 = __mulsf3(*(undefined4 *)(iVar10 + 8),0x45800000);
    sVar2 = __fixsfsi(uVar5);
    *param_4 = sVar3;
  }
LAB_8002b850:
  param_4[1] = sVar2;
  return;
}


/* 8002b880 */

int FUN_8002b880(int param_1,int param_2,short param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  if (*(short *)(param_1 + 0xe) == 0) {
    return 0;
  }
  iVar1 = (int)*(short *)(param_1 + 0xc);
  iVar2 = iVar1 + *(short *)(param_1 + 0xe);
  iVar3 = iVar1;
  if (iVar1 < iVar2) {
    do {
      if (param_3 < *(short *)(iVar1 * 4 + *(int *)(param_2 + 0xc))) {
        iVar1 = iVar2;
      }
      else {
        iVar3 = iVar1;
      }
      iVar1 = iVar1 + 1;
    } while (iVar1 < iVar2);
  }
  return (int)*(short *)(iVar3 * 4 + *(int *)(param_2 + 0xc) + 2);
}


/* 8002b914 */

void FUN_8002b914(int param_1,int param_2,short param_3,char *param_4)

{
  uint uVar1;
  char *pcVar2;
  byte bVar3;
  byte bVar4;
  byte bVar5;
  byte bVar6;
  uint uVar7;
  uint uVar8;
  bool bVar9;
  short *psVar10;
  uint uVar11;
  int iVar12;
  int iVar13;
  int iVar14;
  int iVar15;
  
  iVar14 = (int)param_3;
  if (*(short *)(param_1 + 0x12) == 0) {
    param_4[2] = -0x80;
    param_4[1] = -0x80;
    *param_4 = -0x80;
  }
  else {
    iVar13 = (int)*(short *)(param_1 + 0x10);
    iVar12 = iVar13 + *(short *)(param_1 + 0x12);
    bVar9 = false;
    iVar15 = iVar13;
    if (iVar13 < iVar12) {
      do {
        if (*(short *)(iVar13 * 8 + *(int *)(param_2 + 0x10)) == iVar14) {
          bVar9 = true;
          iVar15 = iVar13;
LAB_8002b9dc:
          iVar13 = iVar12;
        }
        else {
          if (iVar14 <= *(short *)(iVar13 * 8 + *(int *)(param_2 + 0x10))) goto LAB_8002b9dc;
          iVar15 = iVar13;
        }
        iVar13 = iVar13 + 1;
      } while (iVar13 < iVar12);
    }
    iVar13 = iVar15 * 8;
    if ((iVar15 + 1 < iVar12) &&
       (iVar12 = iVar13 + *(int *)(param_2 + 0x10), *(short *)(iVar12 + 10) != 0)) {
      iVar15 = iVar15 * 8;
      if (bVar9) {
        *param_4 = *(char *)(iVar12 + 4);
        param_4[1] = *(char *)(iVar13 + *(int *)(param_2 + 0x10) + 5);
        param_4[2] = *(char *)(iVar13 + *(int *)(param_2 + 0x10) + 6);
      }
      else {
        psVar10 = (short *)(iVar15 + *(int *)(param_2 + 0x10));
        iVar13 = (int)psVar10[4] - (int)*psVar10;
        iVar14 = ((iVar14 - *psVar10) * 0x1000) / iVar13;
        if (iVar13 == 0) {
          trap(7);
        }
        bVar3 = *(byte *)((int)psVar10 + 0xd);
        bVar4 = *(byte *)((int)psVar10 + 5);
        bVar5 = *(byte *)(psVar10 + 7);
        bVar6 = *(byte *)(psVar10 + 3);
        iVar13 = FUN_80022044(iVar14,((uint)*(byte *)(psVar10 + 6) - (uint)*(byte *)(psVar10 + 2)) *
                                     0x1000);
        iVar12 = FUN_80022044(iVar14,((uint)bVar3 - (uint)bVar4) * 0x1000);
        iVar14 = FUN_80022044(iVar14,((uint)bVar5 - (uint)bVar6) * 0x1000);
        *param_4 = *(char *)(iVar15 + *(int *)(param_2 + 0x10) + 4) + (char)(iVar13 >> 0xc);
        param_4[1] = *(char *)(iVar15 + *(int *)(param_2 + 0x10) + 5) + (char)(iVar12 >> 0xc);
        param_4[2] = *(char *)(iVar15 + *(int *)(param_2 + 0x10) + 6) + (char)(iVar14 >> 0xc);
      }
    }
    else {
      iVar14 = iVar15 * 8 + *(uint *)(param_2 + 0x10);
      uVar1 = iVar14 + 7;
      uVar7 = uVar1 & 3;
      uVar11 = iVar14 + 4;
      uVar8 = uVar11 & 3;
      uVar11 = (*(int *)(uVar1 - uVar7) << (3 - uVar7) * 8 |
               *(uint *)(param_2 + 0x10) & 0xffffffffU >> (uVar7 + 1) * 8) & -1 << (4 - uVar8) * 8 |
               *(uint *)(uVar11 - uVar8) >> uVar8 * 8;
      pcVar2 = param_4 + 3;
      uVar1 = (uint)pcVar2 & 3;
      *(uint *)(pcVar2 + -uVar1) =
           *(uint *)(pcVar2 + -uVar1) & -1 << (uVar1 + 1) * 8 | uVar11 >> (3 - uVar1) * 8;
      uVar1 = (uint)param_4 & 3;
      *(uint *)(param_4 + -uVar1) =
           *(uint *)(param_4 + -uVar1) & 0xffffffffU >> (4 - uVar1) * 8 | uVar11 << uVar1 * 8;
    }
  }
  return;
}


/* 8002bbb0 */

int FUN_8002bbb0(int param_1,int *param_2,short param_3,short param_4)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  iVar2 = (int)*(short *)(param_1 + 0x18);
  iVar1 = iVar2 + *(short *)(param_1 + 0x1a);
  if (*(short *)(param_1 + 0x1a) == 0) {
    return (int)*(short *)(param_3 * 0xc + *param_2 + 2);
  }
  iVar3 = iVar2;
  if (iVar2 < iVar1) {
    do {
      if (*(short *)(iVar2 * 4 + param_2[6]) <= param_4) {
        iVar3 = iVar2;
      }
      iVar2 = iVar2 + 1;
    } while (iVar2 < iVar1);
  }
  return (int)*(short *)(iVar3 * 4 + param_2[6] + 2);
}


/* 8002bd44 */

void FUN_8002bd44(void)

{
  int iVar1;
  int iVar2;
  int iVar3;
  
  iVar3 = 0;
  if (0 < *(int *)(DAT_8006d6d8 + 0x170)) {
    do {
      iVar2 = iVar3 * 0xc;
      iVar1 = iVar2 + *(int *)(DAT_8006d6d8 + 0x164);
      *(byte *)(iVar1 + 1) = *(byte *)(iVar1 + 1) | 2;
      iVar1 = iVar2 + *(int *)(DAT_8006d6d8 + 0x164);
      *(byte *)(iVar1 + 1) = *(byte *)(iVar1 + 1) | 4;
      iVar2 = iVar2 + *(int *)(DAT_8006d6d8 + 0x164);
      *(byte *)(iVar2 + 1) = *(byte *)(iVar2 + 1) | 1;
      iVar3 = iVar3 + 1;
    } while (iVar3 < *(int *)(DAT_8006d6d8 + 0x170));
  }
  iVar3 = DAT_8006d6d8;
  iVar1 = *(int *)(DAT_8006d6d8 + 0x170) + -1;
  *(int *)(DAT_8006d6d8 + 0x168) = iVar1;
  *(int *)(iVar3 + 0x16c) = iVar1;
  *(ushort *)(iVar3 + 0x174) = *(ushort *)(iVar3 + 0x174) & 0xfffd;
  *(ushort *)(iVar3 + 0x176) = *(ushort *)(iVar3 + 0x176) & 0xfffd;
  return;
}


