/* 801125e8 */

bool FUN_801125e8(void)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  
  func_0x80017ee0(0,1);
  uVar2 = func_0x800182a8(0x1a);
  func_0x8001811c(uVar2);
  uVar2 = func_0x8002dbb8(0x29);
  iVar3 = func_0x8002df30(uVar2);
  iVar1 = DAT_8013a6ac;
  *(int *)(DAT_8013a6ac + 0x9ec) = iVar3;
  if (iVar3 != 0) {
    func_0x8002d838(0x29,*(undefined4 *)(iVar1 + 0x9ec),uVar2,&LAB_8011266c,0);
  }
  return iVar3 != 0;
}


/* 80113798 */

bool FUN_80113798(void)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  
  func_0x8001eca4(*(undefined4 *)(DAT_8013a6ac + 0x9ec),&DAT_8013a700,&DAT_8013a708);
  func_0x8003f324(0);
  func_0x8002dfe4(*(undefined4 *)(DAT_8013a6ac + 0x9ec));
  uVar2 = func_0x8002dbb8(0x24);
  iVar3 = func_0x8002df30(uVar2);
  iVar1 = DAT_8013a6ac;
  *(int *)(DAT_8013a6ac + 0x9ec) = iVar3;
  if (iVar3 != 0) {
    func_0x8002d838(0x24,*(undefined4 *)(iVar1 + 0x9ec),uVar2,&LAB_80113844,0);
  }
  return iVar3 != 0;
}


/* 801138b4 */

undefined4 FUN_801138b4(void)

{
  *(undefined4 *)(DAT_8013a6ac + 0x830) = 4;
  return 1;
}


/* 801138cc */

undefined4 FUN_801138cc(undefined4 param_1)

{
  func_0x80021190(param_1,0);
  *(undefined4 *)(DAT_8013a6ac + 0x830) = 5;
  return 1;
}


/* 80114390 */

undefined4 FUN_80114390(undefined4 param_1)

{
  undefined1 uVar1;
  byte bVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  byte abStack_20 [8];
  
  func_0x80021190(param_1,0);
  uVar3 = func_0x80012ad0();
  if ((uVar3 & 0x1000) == 0) {
    uVar3 = 0;
    uVar1 = func_0x800135e0();
    func_0x80017034(uVar1,abStack_20);
    while( true ) {
      iVar6 = func_0x800135e0();
      if (iVar6 - 1U <= uVar3) break;
      bVar2 = abStack_20[uVar3];
      uVar7 = func_0x80013610();
      if (bVar2 == uVar7) {
        abStack_20[uVar3] = abStack_20[uVar3 + 1];
        bVar2 = func_0x80013610();
        abStack_20[uVar3 + 1] = bVar2;
      }
      uVar3 = uVar3 + 1 & 0xff;
    }
  }
  else {
    uVar3 = 0;
    abStack_20[3] = func_0x80013610();
    for (uVar7 = 0; uVar5 = func_0x800135e0(), uVar7 < uVar5; uVar7 = uVar7 + 1 & 0xff) {
      uVar5 = func_0x80013610();
      bVar2 = abStack_20[2];
      if (uVar7 != uVar5) {
        iVar6 = func_0x800148dc(uVar7);
        uVar1 = func_0x80013610();
        iVar4 = func_0x800148dc(uVar1);
        bVar2 = (byte)uVar7;
        if (iVar6 != iVar4) {
          abStack_20[uVar3] = (byte)uVar7;
          uVar3 = uVar3 + 1 & 0xff;
          bVar2 = abStack_20[2];
        }
      }
      abStack_20[2] = bVar2;
    }
  }
  func_0x8001a19c(abStack_20[0],abStack_20[1],abStack_20[2],abStack_20[3]);
  func_0x8001a1e4(1);
  uVar3 = func_0x80012ad0();
  if ((uVar3 & 0x6000) == 0x6000) {
    iVar6 = func_0x80012904();
    if (iVar6 == 0) {
      func_0x8001a250(1);
    }
    FUN_80110b98();
  }
  else {
    iVar6 = func_0x80012904();
    if (iVar6 == 0) {
      FUN_80112d7c();
    }
    else {
      FUN_80110b98();
    }
  }
  return 1;
}


/* 80110adc */

undefined4 FUN_80110adc(void)

{
  int iVar1;
  undefined4 uVar2;
  
  uVar2 = 0;
  if (DAT_8013a6ac == 0) {
    DAT_8013a6ac = func_0x8002dec4(0x9f0);
    if (DAT_8013a6ac == 0) {
      uVar2 = 0;
    }
    else {
      func_0x80035d48(DAT_8013a6ac,0,0x9f0);
      iVar1 = DAT_8013a6ac;
      *(undefined2 *)(DAT_8013a6ac + 2000) = 0x10;
      *(undefined4 *)(iVar1 + 0x830) = 7;
      func_0x8001a1e4(0);
      uVar2 = 1;
    }
  }
  return uVar2;
}


/* 80110b98 */

undefined4 FUN_80110b98(void)

{
  undefined4 uVar1;
  uint uVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  
  uVar1 = 0;
  if (*(short *)(DAT_8013a6ac + 2000) == 0x10) {
    iVar4 = 0;
    do {
      iVar3 = iVar4 * 0x58;
      func_0x80035d48(iVar3 + DAT_8013a6ac,0,0x58);
      func_0x80020f54(iVar3 + DAT_8013a6ac);
      func_0x8002115c(iVar3 + DAT_8013a6ac,0xffffff60,0x140);
      iVar4 = iVar4 + 1;
    } while (iVar4 < 0xf);
    func_0x8002115c(DAT_8013a6ac + 0x4d0,0,0);
    FUN_80110d68();
    for (uVar5 = 0; uVar2 = func_0x800135e0(), uVar5 < uVar2; uVar5 = uVar5 + 1) {
      uVar1 = FUN_800ffe90(uVar5);
      iVar4 = uVar5 * 0x54 + 0x528;
      func_0x800221e0(iVar4 + DAT_8013a6ac,uVar1);
      FUN_800ffec8(iVar4 + DAT_8013a6ac,uVar5);
    }
    uVar5 = func_0x80012ad0();
    if ((uVar5 & 0x6000) == 0x6000) {
      iVar4 = func_0x80012904();
      if (iVar4 == 0) {
        iVar4 = func_0x80012934();
        if (iVar4 == 0xff) {
          uVar1 = 0x10;
        }
        else {
          uVar1 = 8;
        }
      }
      else {
        uVar1 = 2;
      }
      *(undefined4 *)(DAT_8013a6ac + 0x82c) = uVar1;
      *(undefined2 *)(DAT_8013a6ac + 2000) = 0xd;
    }
    else {
      func_0x80017c9c(0,0x1a,FUN_801125e8);
      *(undefined2 *)(DAT_8013a6ac + 2000) = 0;
    }
    uVar1 = 1;
  }
  return uVar1;
}


/* 80112c50 */

undefined4 FUN_80112c50(void)

{
  undefined1 uVar1;
  undefined4 uVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  int iVar6;
  undefined4 uVar7;
  
  uVar7 = 0;
  uVar2 = func_0x8001a274();
  iVar3 = func_0x80017144(uVar2);
  uVar4 = func_0x80012ad0();
  if ((((uVar4 & 0x200) != 0) || (uVar4 = func_0x80012ad0(), (uVar4 & 0x10) != 0)) &&
     ((iVar5 = func_0x8001a1bc(0), iVar5 == 0 || (iVar5 = func_0x8001a1bc(0), iVar5 == 1)))) {
    uVar7 = 1;
  }
  uVar4 = func_0x80012ad0();
  if ((uVar4 & 2) != 0) {
    uVar2 = func_0x80012ad0();
    func_0x8001f1c4(uVar2);
    uVar2 = func_0x80012ad0();
    uVar1 = func_0x8001f1c4(uVar2);
    func_0x80012b74(uVar1);
    iVar5 = func_0x80012c54();
    uVar2 = func_0x80012ad0();
    uVar1 = func_0x8001f1c4(uVar2);
    iVar6 = func_0x80012b74(uVar1);
    if (iVar6 <= iVar5) {
      iVar5 = func_0x800138ec(0);
      uVar2 = func_0x8001a1bc(0);
      iVar6 = func_0x800138ec(uVar2);
      if (iVar5 == iVar6) {
        uVar7 = 1;
      }
    }
  }
  if (iVar3 == 0) {
    uVar7 = 1;
  }
  return uVar7;
}
