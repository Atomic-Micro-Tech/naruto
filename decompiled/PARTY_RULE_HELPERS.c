/* 80012780 */

undefined4 FUN_80012780(uint param_1)

{
  ushort uVar1;
  undefined *puVar2;
  int iVar3;
  undefined1 *puVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  
  memset((uchar *)&DAT_80070c80,'\0',0x214);
  iVar3 = (param_1 & 0xff) * 0x30;
  DAT_80070c80 = *(undefined4 *)(&UNK_8006491c + iVar3);
  DAT_80070c8c._0_1_ = (&UNK_80064928)[iVar3];
  DAT_80070cd0 = (&UNK_80064918)[iVar3];
  FUN_80013464((&UNK_80064919)[iVar3]);
  FUN_80012a64(*(undefined4 *)(&UNK_80064920 + iVar3));
  FUN_80012a80(*(undefined4 *)(&UNK_80064924 + iVar3));
  FUN_80012a9c((&UNK_80064929)[iVar3]);
  FUN_80015610((&UNK_8006491a)[iVar3]);
  FUN_80012ae0(0);
  puVar2 = &UNK_80064c78;
  uVar5 = 0;
  do {
    FUN_80012ba4(uVar5 & 0xff,*puVar2);
    uVar6 = uVar5 + 1;
    puVar2 = &UNK_80064c79 + uVar5;
    uVar5 = uVar6;
  } while ((int)uVar6 < 0x10);
  DAT_80070c8c._2_2_ = 0;
  iVar7 = 0;
  do {
    uVar1 = FUN_80012ad0();
    FUN_80012ae0(*(ushort *)(&UNK_8006492a + iVar7 * 4 + iVar3) | uVar1);
    iVar7 = iVar7 + 1;
  } while (iVar7 < 4);
  puVar4 = &DAT_80070cf6;
  iVar7 = 0;
  do {
    *puVar4 = (&UNK_8006493a)[iVar7 + iVar3];
    iVar8 = iVar7 + 1;
    puVar4 = &DAT_80070cf7 + iVar7;
    iVar7 = iVar8;
  } while (iVar8 < 0xc);
  DAT_80070cd3 = 1;
  return 1;
}


/* 800129f4 */

undefined4 FUN_800129f4(uint param_1)

{
  if (param_1 < 0x12) {
    DAT_80070cd0 = (char)param_1;
    return 1;
  }
  return 0;
}


/* 80012af0 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_80012af0(uint param_1)

{
  undefined4 *puVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;
  undefined4 *puVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  undefined4 uVar7;
  undefined4 auStack_40 [16];
  
  puVar1 = (undefined4 *)&DAT_80010000;
  puVar2 = auStack_40;
  do {
    puVar4 = puVar2;
    puVar3 = puVar1;
    uVar5 = puVar3[1];
    uVar6 = puVar3[2];
    uVar7 = puVar3[3];
    *puVar4 = *puVar3;
    puVar4[1] = uVar5;
    puVar4[2] = uVar6;
    puVar4[3] = uVar7;
    puVar1 = puVar3 + 4;
    puVar2 = puVar4 + 4;
  } while (puVar3 + 4 != (undefined4 *)&UNK_80010030);
  uVar5 = puVar3[5];
  uVar6 = puVar3[6];
  puVar4[4] = _UNK_80010030;
  puVar4[5] = uVar5;
  puVar4[6] = uVar6;
  if ((param_1 & 0xff) < 0x10) {
    uVar5 = auStack_40[param_1 & 0xff];
  }
  else {
    uVar5 = 0;
  }
  return uVar5;
}


/* 80012b74 */

int FUN_80012b74(uint param_1)

{
  if ((param_1 & 0xff) < 0x10) {
    return (int)*(short *)(&DAT_80070c90 + (param_1 & 0xff));
  }
  return -1;
}


/* 80012c70 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_80012c70(void)

{
  undefined1 *puVar1;
  undefined1 uVar2;
  uint *puVar3;
  uint uVar4;
  int iVar5;
  undefined4 uVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  int iVar12;
  uint uVar13;
  undefined1 auStack_30 [4];
  undefined1 uStack_2c;
  undefined1 auStack_28 [4];
  undefined1 uStack_24;
  
  puVar1 = auStack_30 + 3;
  uVar13 = (uint)puVar1 & 3;
  *(uint *)(puVar1 + -uVar13) =
       *(uint *)(puVar1 + -uVar13) & -1 << (uVar13 + 1) * 8 | _UNK_8006d6a0 >> (3 - uVar13) * 8;
  auStack_30 = (undefined1  [4])_UNK_8006d6a0;
  uStack_2c = UNK_8006d6a4;
  puVar1 = auStack_28 + 3;
  uVar13 = (uint)puVar1 & 3;
  *(uint *)(puVar1 + -uVar13) =
       *(uint *)(puVar1 + -uVar13) & -1 << (uVar13 + 1) * 8 | _UNK_8006d6a8 >> (3 - uVar13) * 8;
  auStack_28 = (undefined1  [4])_UNK_8006d6a8;
  uStack_24 = UNK_8006d6ac;
  uVar13 = 0;
  do {
    uVar7 = func_0x800135e0();
    iVar12 = 0;
    if (uVar7 <= uVar13) {
      return;
    }
    do {
      FUN_80016258(uVar13,iVar12,0x80);
      iVar12 = iVar12 + 1;
    } while (iVar12 < 4);
    iVar12 = 0;
    do {
      iVar5 = FUN_8001378c(uVar13);
      FUN_80014450(uVar13,iVar12,(&UNK_800648e4)[iVar12 + iVar5 * 4]);
      iVar12 = iVar12 + 1;
    } while (iVar12 < 4);
    uVar9 = uVar13;
    iVar5 = FUN_8001378c();
    iVar12 = uVar13 * 0xb4;
    uVar4 = iVar5 * 9;
    uVar7 = (uint)(&UNK_80064c8b + uVar4) & 3;
    uVar10 = (uint)(&UNK_80064c88 + uVar4) & 3;
    uVar8 = (*(int *)(&UNK_80064c8b + uVar4 + -uVar7) << (3 - uVar7) * 8 |
            uVar4 & 0xffffffffU >> (uVar7 + 1) * 8) & -1 << (4 - uVar10) * 8 |
            *(uint *)(&UNK_80064c88 + uVar4 + -uVar10) >> uVar10 * 8;
    uVar7 = (uint)(&UNK_80064c8f + uVar4) & 3;
    uVar10 = (uint)(&UNK_80064c8c + uVar4) & 3;
    uVar10 = (*(int *)(&UNK_80064c8f + uVar4 + -uVar7) << (3 - uVar7) * 8 |
             uVar9 & 0xffffffffU >> (uVar7 + 1) * 8) & -1 << (4 - uVar10) * 8 |
             *(uint *)(&UNK_80064c8c + uVar4 + -uVar10) >> uVar10 * 8;
    uVar2 = (&DAT_80064c90)[uVar4];
    uVar7 = iVar12 + 0x80070f4dU & 3;
    puVar3 = (uint *)((iVar12 + 0x80070f4dU) - uVar7);
    *puVar3 = *puVar3 & -1 << (uVar7 + 1) * 8 | uVar8 >> (3 - uVar7) * 8;
    uVar7 = iVar12 + 0x80070f4aU & 3;
    puVar3 = (uint *)((iVar12 + 0x80070f4aU) - uVar7);
    *puVar3 = *puVar3 & 0xffffffffU >> (4 - uVar7) * 8 | uVar8 << uVar7 * 8;
    uVar7 = iVar12 + 0x80070f51U & 3;
    puVar3 = (uint *)((iVar12 + 0x80070f51U) - uVar7);
    *puVar3 = *puVar3 & -1 << (uVar7 + 1) * 8 | uVar10 >> (3 - uVar7) * 8;
    uVar7 = iVar12 + 0x80070f4eU & 3;
    puVar3 = (uint *)((iVar12 + 0x80070f4eU) - uVar7);
    *puVar3 = *puVar3 & 0xffffffffU >> (4 - uVar7) * 8 | uVar10 << uVar7 * 8;
    *(undefined1 *)((int)&DAT_80070f50 + iVar12 + 2) = uVar2;
    iVar5 = FUN_8001378c(uVar13);
    uVar2 = (&DAT_80064d01)[iVar5 * 2];
    *(undefined *)((int)&DAT_80070f50 + iVar12 + 3) = (&DAT_80064d00)[iVar5 * 2];
    (&DAT_80070f54)[iVar12] = uVar2;
    iVar12 = 0;
    uVar6 = func_0x80012a44();
    FUN_8001387c(uVar13,uVar6);
    uVar6 = func_0x80012a54();
    FUN_800143ac(uVar13,uVar6);
    do {
      uVar7 = FUN_8001378c(uVar13);
      if (uVar7 == (byte)auStack_30[iVar12]) {
        iVar5 = FUN_80016c68(iVar12 + 0x57);
        iVar11 = 0;
        if (iVar5 == 0) {
          for (; iVar11 < 4; iVar11 = iVar11 + 1) {
            uVar7 = func_0x80014404(uVar13,iVar11);
            if (uVar7 == (byte)auStack_28[iVar12]) {
              FUN_80014450(uVar13,iVar11,0xe);
              break;
            }
          }
        }
      }
      iVar12 = iVar12 + 1;
    } while (iVar12 < 5);
    uVar13 = uVar13 + 1;
  } while( true );
}


/* 800122e4 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_800122e4(void)

{
  undefined4 *puVar1;
  undefined4 *puVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  undefined4 uVar5;
  
  puVar1 = &DAT_80070c80;
  puVar2 = &DAT_8007078c;
  do {
    uVar3 = puVar2[1];
    uVar4 = puVar2[2];
    uVar5 = puVar2[3];
    *puVar1 = *puVar2;
    puVar1[1] = uVar3;
    puVar1[2] = uVar4;
    puVar1[3] = uVar5;
    puVar2 = puVar2 + 4;
    puVar1 = puVar1 + 4;
  } while (puVar2 != (undefined4 *)&UNK_8007099c);
  *puVar1 = _UNK_8007099c;
  puVar1 = (undefined4 *)&DAT_80070ea0;
  puVar2 = &DAT_800709a0;
  do {
    uVar3 = puVar2[1];
    uVar4 = puVar2[2];
    uVar5 = puVar2[3];
    *puVar1 = *puVar2;
    puVar1[1] = uVar3;
    puVar1[2] = uVar4;
    puVar1[3] = uVar5;
    puVar2 = puVar2 + 4;
    puVar1 = puVar1 + 4;
  } while (puVar2 != (undefined4 *)&UNK_80070c70);
  *puVar1 = _UNK_80070c70;
  return 1;
}


