/* 800c5978 */

undefined4 FUN_800c5978(int param_1)

{
  ushort *puVar1;
  byte *pbVar2;
  short sVar3;
  int *piVar4;
  undefined1 uVar5;
  undefined4 uVar6;
  int iVar7;
  int iVar8;
  uint uVar9;
  int *piVar10;
  int iVar11;
  undefined8 uVar12;
  
  piVar10 = DAT_8013ea74;
  switch(DAT_8013ea74[0x117]) {
  case 0:
    puVar1 = (ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + (uint)*puVar1 * 0x90 + 0x3a) + -3;
    iVar8 = (short)piVar10[(uint)*puVar1 * 0x24 + 0xf] + -0x12;
    goto LAB_800c718c;
  case 1:
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar7 = (int)*(short *)((uint)*(byte *)((int)piVar10 +
                                           (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124
                            + *piVar10 + 0x22) - (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + -1;
    sVar3 = *(short *)((uint)*(byte *)((int)piVar10 +
                                      (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124 +
                       *piVar10 + 0x24);
    piVar10[0x111] = ((iVar7 + -0xa1) * iVar8 >> 0x10) + 0xa0;
    piVar10[0x112] =
         ((((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x76) * iVar8 >> 0x10) + 0x78;
    uVar6 = 0x25;
    goto LAB_800c6ab0;
  case 2:
    puVar1 = (ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + (uint)*puVar1 * 0x90 + 0x3a) + -1;
    iVar8 = (short)piVar10[(uint)*puVar1 * 0x24 + 0xf] + -0x14;
    goto LAB_800c718c;
  case 3:
    uVar9 = (uint)*(ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + uVar9 * 0x90 + 0x3a) + -4;
    piVar10[0x112] = (short)piVar10[uVar9 * 0x24 + 0xf] + -0x18;
    iVar8 = piVar10[0x13d];
    if (iVar8 < 0) {
      iVar8 = -iVar8;
    }
    if (iVar8 < 100) {
      if ((*(ushort *)((int)piVar10 + uVar9 * 0x90 + 10) & 0x100) == 0) {
        uVar6 = func_0x800136fc();
        FUN_8010097c(uVar6,2);
      }
      piVar10 = DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x24;
      uVar5 = 2;
    }
    else {
      if ((*(ushort *)((int)DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 10) &
          0x100) == 0) {
        uVar6 = func_0x800136fc();
        FUN_8010097c(uVar6,3);
      }
      piVar10 = DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x24;
      uVar5 = 3;
    }
    *(undefined1 *)((int)piVar10 + 0x22) = uVar5;
    uVar6 = 0x15;
LAB_800c6ab0:
    func_0x80018300(0x4c00,3,uVar6,1,1);
    func_0x80018468(1,0xb4);
    func_0x80018508(1,0);
    goto LAB_800c7194;
  case 4:
    iVar8 = *DAT_8013ea74;
    DAT_8013ea74[0x111] =
         ((int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                         (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0x1f) *
                          0x124 + iVar8 + 0x22) - (int)*(short *)((int)DAT_8013ea74 + 0x48a)) + -2;
    piVar10[0x112] =
         ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                         (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124 +
                          iVar8 + 0x24) - (int)*(short *)((int)piVar10 + 0x48e)) + 4;
    *(undefined1 *)((int)piVar10 + (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x22) = 3;
    break;
  case 6:
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    piVar4 = DAT_8013ea74;
    if ((uint)*(ushort *)(piVar10 + 0x121) == (uint)*(ushort *)((int)piVar10 + 0x486)) {
      piVar10[0x111] =
           ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                           (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124
                            + *piVar10 + 0x22) - (int)*(short *)((int)piVar10 + 0x48a)) + -2;
      piVar10[0x112] =
           ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                           (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124
                            + *piVar10 + 0x24) - (int)*(short *)((int)piVar10 + 0x48e)) + 4;
    }
    else {
      pbVar2 = (byte *)(DAT_8013ea74 + 0x128);
      iVar7 = *DAT_8013ea74;
      DAT_8013ea74[0x111] =
           ((int)*(short *)((uint)*pbVar2 * 0x124 + iVar7 + 0x22) -
           (int)*(short *)((int)DAT_8013ea74 + 0x48a)) + -2;
      piVar4[0x112] =
           ((int)*(short *)((uint)*pbVar2 * 0x124 + iVar7 + 0x24) -
           (int)*(short *)((int)piVar4 + 0x48e)) + 4;
    }
    piVar10 = DAT_8013ea74;
    iVar7 = ((DAT_8013ea74[0x111] + -0xa0) * iVar8 >> 0x10) + 0xa0;
    DAT_8013ea74[0x111] = iVar7;
    piVar10[0x113] = iVar7;
    iVar8 = ((piVar10[0x112] + -0x78) * iVar8 >> 0x10) + 0x78;
    piVar10[0x112] = iVar8;
    piVar10[0x114] = iVar8;
    break;
  case 7:
    func_0x800188f0(*(undefined1 *)
                     ((int)DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0xf),1,0)
    ;
    piVar10 = DAT_8013ea74;
    puVar1 = (ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + (uint)*puVar1 * 0x90 + 0x3a) + -2;
    iVar8 = (short)piVar10[(uint)*puVar1 * 0x24 + 0xf] + -0x12;
    goto LAB_800c718c;
  case 8:
    DAT_8013ea74[0x115] =
         (int)*(short *)((int)DAT_8013ea74 + 0x48a) +
         DAT_8013ea74[*(ushort *)(DAT_8013ea74 + 0x121) + 0x119];
    piVar10[0x116] =
         (int)*(short *)((int)piVar10 + 0x48e) + piVar10[*(ushort *)(piVar10 + 0x121) + 0x11d];
    piVar10[0x111] = piVar10[*(ushort *)(piVar10 + 0x121) + 0x119] + -2;
    piVar10[0x112] = piVar10[*(ushort *)(piVar10 + 0x121) + 0x11d] + -6;
    piVar10[0x113] = piVar10[*(ushort *)(piVar10 + 0x121) + 0x119] + -2;
    piVar10[0x114] = piVar10[*(ushort *)(piVar10 + 0x121) + 0x11d] + -6;
    break;
  case 9:
    uVar9 = (uint)*(ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + uVar9 * 0x90 + 0x3a) + -2;
    piVar10[0x112] = (short)piVar10[uVar9 * 0x24 + 0xf] + -0x12;
    piVar10[0x113] = *(short *)((int)piVar10 + uVar9 * 0x90 + 0x3a) + -2;
    piVar10[0x114] = (short)piVar10[uVar9 * 0x24 + 0xf] + -0x12;
    break;
  case 10:
    func_0x80018300(0x4c00,3,0x35,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    iVar8 = *DAT_8013ea74;
    DAT_8013ea74[0x111] =
         ((int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                         (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0x1f) *
                          0x124 + iVar8 + 0x22) - (int)*(short *)((int)DAT_8013ea74 + 0x48a)) + -2;
    iVar8 = ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                            (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) *
                             0x124 + iVar8 + 0x24) - (int)*(short *)((int)piVar10 + 0x48e)) + 4;
    goto LAB_800c718c;
  case 0xb:
    func_0x80018300(0x4c00,3,0x37,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    iVar8 = *DAT_8013ea74;
    DAT_8013ea74[0x111] =
         ((int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                         (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0x1f) *
                          0x124 + iVar8 + 0x22) - (int)*(short *)((int)DAT_8013ea74 + 0x48a)) + -2;
    piVar10[0x112] =
         ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                         (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124 +
                          iVar8 + 0x24) - (int)*(short *)((int)piVar10 + 0x48e)) + 4;
    *(undefined1 *)((int)piVar10 + (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x22) = 3;
    if ((*(ushort *)((int)DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 10) &
        0x100) == 0) {
      uVar6 = func_0x800136fc();
      FUN_8010097c(uVar6,10);
    }
    goto LAB_800c7194;
  case 0xc:
    func_0x80018300(0x4c00,3,0x36,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    iVar8 = *DAT_8013ea74;
    DAT_8013ea74[0x111] =
         ((int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                         (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0x1f) *
                          0x124 + iVar8 + 0x22) - (int)*(short *)((int)DAT_8013ea74 + 0x48a)) + -2;
    piVar10[0x112] =
         ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                         (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124 +
                          iVar8 + 0x24) - (int)*(short *)((int)piVar10 + 0x48e)) + 4;
    *(undefined1 *)((int)piVar10 + (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x22) = 3;
    if ((*(ushort *)((int)DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 10) &
        0x100) == 0) {
      uVar6 = func_0x800136fc();
      FUN_8010097c(uVar6,7);
    }
    goto LAB_800c7194;
  case 0xd:
    func_0x80018300(0x4c00,3,0x38,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    iVar8 = *DAT_8013ea74;
    DAT_8013ea74[0x111] =
         ((int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                         (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0x1f) *
                          0x124 + iVar8 + 0x22) - (int)*(short *)((int)DAT_8013ea74 + 0x48a)) + -2;
    piVar10[0x112] =
         ((int)*(short *)((uint)*(byte *)((int)piVar10 +
                                         (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124 +
                          iVar8 + 0x24) - (int)*(short *)((int)piVar10 + 0x48e)) + 4;
    *(undefined1 *)((int)piVar10 + (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x22) = 3;
    if ((*(ushort *)((int)DAT_8013ea74 + (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 10) &
        0x100) == 0) {
      uVar6 = func_0x800136fc();
      FUN_8010097c(uVar6,9);
    }
    goto LAB_800c7194;
  case 0xe:
    puVar1 = (ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + (uint)*puVar1 * 0x90 + 0x3a) + 1;
    iVar8 = (short)piVar10[(uint)*puVar1 * 0x24 + 0xf] + -0x12;
    goto LAB_800c718c;
  case 0xf:
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar11 = *piVar10;
    iVar7 = (int)*(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + iVar11 + 0x22) -
            (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + -1;
    sVar3 = *(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + iVar11 + 0x24);
    piVar10[0x111] = ((iVar7 + -0xa1) * iVar8 >> 0x10) + 0xa0;
    piVar10[0x112] =
         ((((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x7a) * iVar8 >> 0x10) + 0x78;
    if ((*(ushort *)
          ((int)piVar10 +
          (uint)(*(ushort *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + iVar11 + 0x20) >> 0xc) *
          0x90 + 10) & 0x100) == 0) {
      uVar6 = func_0x800136fc();
      FUN_8010097c(uVar6,6);
    }
    goto LAB_800c7194;
  case 0x10:
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    if (DAT_8013eaac == '\0') {
      func_0x80018300(0x4c00,3,0x4c,4,1);
      func_0x80018468(4,0xb4);
      func_0x80018508(4,0);
      piVar10 = DAT_8013ea74;
      if ((char)DAT_8013ea74[0x163] == '\0') {
        if (DAT_8013ea74[0x14c] != 0x23) {
          iVar11 = *DAT_8013ea74;
          iVar7 = (int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                                 (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 +
                                                 0x1f) * 0x124 + iVar11 + 0x22) -
                  (int)*(short *)((int)DAT_8013ea74 + 0x48a);
          DAT_8013ea74[0x111] = iVar7 + -1;
          sVar3 = *(short *)((uint)*(byte *)((int)piVar10 +
                                            (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) *
                             0x124 + iVar11 + 0x24);
          piVar10[0x111] = ((iVar7 + -0xa1) * iVar8 >> 0x10) + 0xa0;
          iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x80;
          goto LAB_800c5e5c;
        }
        DAT_8013ea74[0x111] =
             *(short *)((int)DAT_8013ea74 +
                       (uint)*(byte *)((int)DAT_8013ea74 + *(byte *)(DAT_8013ea74 + 0x164) + 0x58d)
                       * 0x90 + 0x3a) + -1;
        piVar10[0x112] =
             (short)piVar10[(uint)*(byte *)((int)piVar10 + *(byte *)(piVar10 + 0x164) + 0x58d) *
                            0x24 + 0xf] + -8;
      }
      else {
        iVar11 = *DAT_8013ea74;
        iVar7 = (int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 + 0x52d) * 0x124 + iVar11 + 0x22)
                - (int)*(short *)((int)DAT_8013ea74 + 0x48a);
        DAT_8013ea74[0x111] = iVar7 + -1;
        sVar3 = *(short *)((uint)*(byte *)((int)piVar10 + 0x52d) * 0x124 + iVar11 + 0x24);
        piVar10[0x111] = ((iVar7 + -0xa1) * iVar8 >> 0x10) + 0xa0;
        piVar10[0x112] =
             ((((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x80) * iVar8 >> 0x10) + 0x78
        ;
      }
    }
    else {
      func_0x80018300(0x4c00,3,0x4c,4,1);
      func_0x80018468(4,0xb4);
      func_0x80018508(4,0);
      piVar10 = DAT_8013ea74;
      iVar11 = *DAT_8013ea74;
      iVar7 = (int)*(short *)((uint)*(byte *)((int)DAT_8013ea74 +
                                             (uint)*(ushort *)(DAT_8013ea74 + 0x121) * 0x90 + 0x1f)
                              * 0x124 + iVar11 + 0x22) - (int)*(short *)((int)DAT_8013ea74 + 0x48a);
      DAT_8013ea74[0x111] = iVar7 + -1;
      sVar3 = *(short *)((uint)*(byte *)((int)piVar10 +
                                        (uint)*(ushort *)(piVar10 + 0x121) * 0x90 + 0x1f) * 0x124 +
                         iVar11 + 0x24);
      piVar10[0x111] = ((iVar7 + -0xa1) * iVar8 >> 0x10) + 0xa0;
      iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x71;
LAB_800c5e5c:
      piVar10[0x112] = (iVar7 * iVar8 >> 0x10) + 0x78;
    }
    break;
  case 0x11:
    func_0x80018300(0x4c00,3,0x39,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar7 = (int)*(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x22) -
            (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + 0x22;
    sVar3 = *(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x24);
    piVar10[0x111] = ((iVar7 + -0x7e) * iVar8 >> 0x10) + 0xa0;
    iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0xb4;
    goto LAB_800c6318;
  case 0x12:
    func_0x80018300(0x4c00,3,0x3a,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar7 = (int)*(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x22) -
            (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + 0x14;
    sVar3 = *(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x24);
    piVar10[0x111] = ((iVar7 + -0x8c) * iVar8 >> 0x10) + 0xa0;
    iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x90;
    goto LAB_800c6318;
  case 0x13:
    func_0x80018300(0x4c00,3,0x3c,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar7 = (int)*(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x22) -
            (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + 0x2a;
    sVar3 = *(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x24);
    piVar10[0x111] = ((iVar7 + -0x76) * iVar8 >> 0x10) + 0xa0;
    iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0xb9;
    goto LAB_800c6318;
  case 0x14:
    func_0x80018300(0x4c00,3,0x3b,2,1);
    func_0x80018468(2,0xb4);
    func_0x80018508(2,0);
    piVar10 = DAT_8013ea74;
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar7 = (int)*(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x22) -
            (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + 0x3f;
    sVar3 = *(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x24);
    piVar10[0x111] = ((iVar7 + -0x61) * iVar8 >> 0x10) + 0xa0;
    iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0xb2;
    goto LAB_800c6318;
  case 0x15:
    uVar6 = 0x43;
    goto LAB_800c5a40;
  case 0x16:
    uVar6 = 0x44;
    goto LAB_800c5a40;
  case 0x17:
    uVar6 = 0x45;
    goto LAB_800c5a40;
  case 0x18:
    uVar6 = 0x46;
    goto LAB_800c5a40;
  case 0x19:
    uVar6 = 0x47;
LAB_800c5a40:
    func_0x80018300(0x4c00,3,uVar6,4,1);
    func_0x80018468(4,0xb4);
    func_0x80018508(4,0);
    *(undefined1 *)(DAT_8013ea74 + 0x180) = 0;
    piVar10 = DAT_8013ea74;
    uVar9 = (uint)*(ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = (int)*(short *)((int)DAT_8013ea74 + uVar9 * 0x90 + 0x3a);
    piVar10[0x112] = (short)piVar10[uVar9 * 0x24 + 0xf] + 0x10;
    if ((*(ushort *)((int)piVar10 + uVar9 * 0x90 + 10) & 0x100) == 0) {
      uVar6 = func_0x800136fc();
      FUN_8010097c(uVar6,0xb);
    }
    goto LAB_800c7194;
  case 0x1b:
    DAT_8013ead4 = 0;
    puVar1 = (ushort *)(DAT_8013ea74 + 0x121);
    DAT_8013ea74[0x111] = *(short *)((int)DAT_8013ea74 + (uint)*puVar1 * 0x90 + 0x3a) + -1;
    iVar8 = (short)piVar10[(uint)*puVar1 * 0x24 + 0xf] + -8;
LAB_800c718c:
    piVar10[0x112] = iVar8;
    break;
  case 0x1c:
  case 0x1d:
    DAT_8013ead4 = 0;
    DAT_8013ea74[0x111] = 0xa0;
    piVar10[0x112] = 0x78;
    break;
  case 0x1e:
    DAT_8013ead4 = 0;
    uVar12 = func_0x80038e28(DAT_8013ea74[0x124],DAT_8013ea74[0x125],0,0x40f00000);
    iVar8 = func_0x80038848((int)uVar12,(int)((ulonglong)uVar12 >> 0x20));
    iVar7 = (int)*(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x22) -
            (int)*(short *)((int)piVar10 + 0x48a);
    piVar10[0x111] = iVar7 + -1;
    sVar3 = *(short *)((uint)*(byte *)(piVar10 + 0x148) * 0x124 + *piVar10 + 0x24);
    piVar10[0x111] = ((iVar7 + -0xa1) * iVar8 >> 0x10) + 0xa0;
    iVar7 = ((int)sVar3 - (int)*(short *)((int)piVar10 + 0x48e)) + -0x76;
LAB_800c6318:
    piVar10[0x112] = (iVar7 * iVar8 >> 0x10) + 0x78;
  }
LAB_800c7194:
  piVar10 = DAT_8013ea74;
  DAT_8013ea74[0x10f] = param_1;
  iVar8 = piVar10[0x117];
  if ((((iVar8 != 0x1b) && (iVar8 != 0x1e)) && (iVar8 != 0x1d)) && (iVar8 != 0x1c)) {
    if (iVar8 == 9) {
      if (*(char *)((int)piVar10 + 0x2eb) != '%') {
        uVar6 = FUN_80116ba4();
        iVar8 = func_0x800221e0(DAT_8013ea74 + 0xe5,uVar6);
        if (iVar8 != 0) {
          func_0x80022298(DAT_8013ea74 + 0xe5,0,0x19);
          func_0x80022298(DAT_8013ea74 + 0xe5,1,0x1b);
          func_0x800222c8(DAT_8013ea74 + 0xe5,0,0xfc);
          func_0x80022548(DAT_8013ea74 + 0xe5,0);
          func_0x80022510(DAT_8013ea74 + 0xe5,8);
          func_0x80022774(DAT_8013ea74 + 0xe5,0,0);
          uVar6 = FUN_80116ba4();
          iVar8 = func_0x800221e0(DAT_8013ea74 + 0xfa,uVar6);
          if (iVar8 != 0) {
            func_0x80022298(DAT_8013ea74 + 0xfa,0,0x19);
            func_0x80022298(DAT_8013ea74 + 0xfa,1,0x1b);
            func_0x800222c8(DAT_8013ea74 + 0xfa,0,0xfc);
            func_0x80022548(DAT_8013ea74 + 0xfa,1);
            func_0x80022510(DAT_8013ea74 + 0xfa,8);
            func_0x80022740(DAT_8013ea74 + 0xfa,FUN_800c754c);
            func_0x80022774(DAT_8013ea74 + 0xfa,0,0);
            goto LAB_800c7514;
          }
        }
        return 0;
      }
    }
    else if (DAT_8013ea74[0x117] != 8) {
      if (DAT_8013ea74[0x117] == 6) {
        uVar6 = FUN_80116ba4();
        iVar8 = func_0x800221e0(DAT_8013ea74 + 0xfa,uVar6);
        if (iVar8 == 0) {
          return 0;
        }
        func_0x80022298(DAT_8013ea74 + 0xfa,0,0x19);
        func_0x80022298(DAT_8013ea74 + 0xfa,1,0x1b);
        func_0x800222c8(DAT_8013ea74 + 0xfa,0,0xfc);
        func_0x80022548(DAT_8013ea74 + 0xfa,1);
        func_0x80022510(DAT_8013ea74 + 0xfa,8);
        if (DAT_8013ea74[0x117] != 8) {
          func_0x80022774(DAT_8013ea74 + 0xfa,0,0);
        }
      }
      uVar6 = FUN_80116ba4();
      iVar8 = func_0x800221e0(DAT_8013ea74 + 0xe5,uVar6);
      if (iVar8 == 0) {
        return 0;
      }
      func_0x80022298(DAT_8013ea74 + 0xe5,0,0x19);
      func_0x80022298(DAT_8013ea74 + 0xe5,1,0x1b);
      func_0x800222c8(DAT_8013ea74 + 0xe5,0,0xfc);
      func_0x80022548(DAT_8013ea74 + 0xe5,0);
      func_0x80022510(DAT_8013ea74 + 0xe5,8);
      func_0x80022740(DAT_8013ea74 + 0xe5,FUN_800c754c);
      if (DAT_8013ea74[0x117] != 8) {
        func_0x80022774(DAT_8013ea74 + 0xe5,0,0);
      }
    }
  }
LAB_800c7514:
  *(undefined1 *)((int)DAT_8013ea74 + 0x602) = 1;
  *(undefined1 *)(DAT_8013eae4 + 0x8c) = 0;
  return 1;
}


/* 800c754c */

undefined4 FUN_800c754c(void)

{
  *(undefined4 *)(DAT_8013ea74 + 0x43c) = 0xfe;
  return 1;
}


