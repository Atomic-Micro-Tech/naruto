/* 80013488 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80013488(void)

{
  return DAT_80070cd1;
}


/* 80013464 */

undefined4 FUN_80013464(byte param_1)

{
  if (param_1 < 0x1f) {
    DAT_80070cd1 = param_1;
    return 1;
  }
  return 1;
}


/* 80012c14 */

void FUN_80012c14(void)

{
  DAT_80070cd3 = 0;
  return;
}


/* 80012c54 */

undefined2 FUN_80012c54(void)

{
  return DAT_80070cf4;
}


/* 80012eac */

void FUN_80012eac(void)

{
  undefined1 uVar1;
  uint uVar2;
  uint *puVar3;
  ushort uVar4;
  int iVar5;
  undefined1 *puVar6;
  uint uVar7;
  undefined4 uVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  uint uVar12;
  int iVar13;
  int iVar14;
  
  iVar5 = (uint)(byte)(&DAT_80058758)[DAT_80070734 * 0x84 + (uint)DAT_8007073c * 0xc] * 0x54;
  DAT_80070cd0 = (&DAT_80057798)[iVar5];
  FUN_80013464((&DAT_80057799)[iVar5]);
  DAT_80070c80 = *(undefined4 *)(&DAT_8005779c + iVar5);
  FUN_80012a64(*(undefined4 *)(&DAT_800577a0 + iVar5));
  FUN_80012a80(*(undefined4 *)(&DAT_800577a4 + iVar5));
  FUN_80012a9c((&DAT_800577a9)[iVar5]);
  FUN_80015610((&DAT_8005779a)[iVar5]);
  DAT_80070cd3 = 1;
  FUN_80012ae0(0);
  uVar12 = 0;
  do {
    FUN_80012ba4(uVar12 & 0xff,0);
    uVar12 = uVar12 + 1;
  } while ((int)uVar12 < 0x10);
  iVar13 = 0;
  do {
    uVar12 = 0;
    uVar4 = FUN_80012ad0();
    FUN_80012ae0(*(ushort *)(&DAT_800577aa + iVar13 * 4 + iVar5) | uVar4);
    do {
      if (((int)(uint)*(ushort *)(&DAT_800577aa + iVar13 * 4 + iVar5) >> (uVar12 & 0x1f) & 1U) != 0)
      {
        FUN_80012ba4(uVar12 & 0xff,(int)*(short *)(&DAT_800577ac + iVar13 * 4 + iVar5));
      }
      uVar12 = uVar12 + 1;
    } while ((int)uVar12 < 0x10);
    iVar13 = iVar13 + 1;
  } while (iVar13 < 4);
  puVar6 = &DAT_80070cf6;
  iVar13 = 0;
  do {
    *puVar6 = (&DAT_800577ba)[iVar13 + iVar5];
    iVar14 = iVar13 + 1;
    puVar6 = &DAT_80070cf7 + iVar13;
    iVar13 = iVar14;
  } while (iVar14 < 0xc);
  iVar13 = 0;
  FUN_80013498();
  uVar12 = 0;
  if ((byte)(&DAT_800577c6)[iVar5] < 0xd) {
    iVar14 = 0;
    do {
      FUN_8001373c(uVar12,(&DAT_800577c6)[iVar14 + uVar12 + iVar5]);
      uVar10 = 0;
      iVar14 = uVar12 * 4;
      do {
        uVar9 = uVar10;
        FUN_80016258(uVar12,uVar10,(&DAT_800577da)[iVar14 + iVar5]);
        uVar10 = uVar10 + 1;
        iVar14 = uVar10 + uVar12 * 4;
      } while ((int)uVar10 < 4);
      uVar7 = uVar12;
      iVar14 = FUN_8001378c();
      iVar11 = uVar12 * 0xb4;
      iVar14 = iVar14 * 9;
      uVar10 = (uint)(&UNK_80064c8b + iVar14) & 3;
      uVar2 = (uint)(&UNK_80064c88 + iVar14) & 3;
      uVar7 = (*(int *)(&UNK_80064c8b + iVar14 + -uVar10) << (3 - uVar10) * 8 |
              uVar7 & 0xffffffffU >> (uVar10 + 1) * 8) & -1 << (4 - uVar2) * 8 |
              *(uint *)(&UNK_80064c88 + iVar14 + -uVar2) >> uVar2 * 8;
      uVar10 = (uint)(&UNK_80064c8f + iVar14) & 3;
      uVar2 = (uint)(&UNK_80064c8c + iVar14) & 3;
      uVar9 = (*(int *)(&UNK_80064c8f + iVar14 + -uVar10) << (3 - uVar10) * 8 |
              uVar9 & 0xffffffffU >> (uVar10 + 1) * 8) & -1 << (4 - uVar2) * 8 |
              *(uint *)(&UNK_80064c8c + iVar14 + -uVar2) >> uVar2 * 8;
      uVar1 = (&DAT_80064c90)[iVar14];
      uVar10 = iVar11 + 0x80070f4dU & 3;
      puVar3 = (uint *)((iVar11 + 0x80070f4dU) - uVar10);
      *puVar3 = *puVar3 & -1 << (uVar10 + 1) * 8 | uVar7 >> (3 - uVar10) * 8;
      uVar10 = iVar11 + 0x80070f4aU & 3;
      puVar3 = (uint *)((iVar11 + 0x80070f4aU) - uVar10);
      *puVar3 = *puVar3 & 0xffffffffU >> (4 - uVar10) * 8 | uVar7 << uVar10 * 8;
      uVar10 = iVar11 + 0x80070f51U & 3;
      puVar3 = (uint *)((iVar11 + 0x80070f51U) - uVar10);
      *puVar3 = *puVar3 & -1 << (uVar10 + 1) * 8 | uVar9 >> (3 - uVar10) * 8;
      uVar10 = iVar11 + 0x80070f4eU & 3;
      puVar3 = (uint *)((iVar11 + 0x80070f4eU) - uVar10);
      *puVar3 = *puVar3 & 0xffffffffU >> (4 - uVar10) * 8 | uVar9 << uVar10 * 8;
      *(undefined1 *)((int)&DAT_80070f50 + iVar11 + 2) = uVar1;
      iVar14 = FUN_8001378c(uVar12);
      uVar1 = (&DAT_80064d01)[iVar14 * 2];
      *(undefined *)((int)&DAT_80070f50 + iVar11 + 3) = (&DAT_80064d00)[iVar14 * 2];
      (&DAT_80070f54)[iVar11] = uVar1;
      FUN_8001387c(uVar12,*(undefined4 *)(&DAT_8005779c + iVar5));
      iVar11 = 0;
      iVar14 = uVar12 * 5;
      do {
        FUN_80014450(uVar12,iVar11,(&DAT_800577c7)[iVar14 + iVar5]);
        iVar11 = iVar11 + 1;
        iVar14 = iVar11 + uVar12 * 5;
      } while (iVar11 < 4);
      FUN_800143ac(uVar12,(&DAT_800577a8)[iVar5]);
      if ((&DAT_80057798)[iVar5] == '\x11') {
        uVar8 = 1;
        if (uVar12 == 1) {
LAB_800131f4:
          FUN_80013620(uVar8,0);
        }
        else {
          FUN_80013620(uVar12,1);
        }
      }
      else {
        if (uVar12 == 0) {
          uVar8 = 0;
          goto LAB_800131f4;
        }
        FUN_80013620(uVar12,1);
      }
      iVar13 = iVar13 + 1;
      uVar12 = uVar12 + 1;
    } while (((int)uVar12 < 4) &&
            (iVar14 = uVar12 * 4, (byte)(&DAT_800577c6)[uVar12 * 5 + iVar5] < 0xd));
  }
  FUN_800135bc(iVar13);
  FUN_80012c64(0);
  memset(&DAT_80070cd4,'\0',0x20);
  return;
}


/* 80014098 */

undefined4 FUN_80014098(uint param_1,undefined2 param_2)

{
  if (param_1 < 4) {
    *(undefined2 *)(&DAT_80070ec0 + param_1 * 0x2d) = param_2;
    return 1;
  }
  return 0;
}


