/* 80017220 */

undefined4 FUN_80017220(void)

{
  DAT_8006d6b0 = 0;
  if (DAT_800652b0 != -1) {
    DAT_8006d6b0 = 0;
    do {
      DAT_8006d6b0 = DAT_8006d6b0 + 1;
    } while ((&DAT_800652b0)[DAT_8006d6b0] != -1);
  }
  FUN_80049998();
  FUN_800179d4(0);
  SsSetTableSize(&DAT_80071178,10,1);
  SsSetTickMode(1);
  SsStart();
  FUN_800195ec(200);
  FUN_80019608(200);
  FUN_80019624(2);
  FUN_80019658(0x40);
  FUN_80019674(0x40);
  FUN_80017410();
  return 1;
}


/* 800172ec */

undefined4 FUN_800172ec(void)

{
  int iVar1;
  undefined4 uVar2;
  CdlFILE *pCVar3;
  CdlFILE CStack_20;
  
  iVar1 = FUN_80019878(0x5b9,0x21f50,0x5c00,2,0x2c00,0x2000,0x4800,0x400);
  uVar2 = 0;
  if (iVar1 != 0) {
    FUN_800196c4();
    while (pCVar3 = CdSearchFile(&CStack_20,"\\DATA2.BIN;1"), pCVar3 == (CdlFILE *)0x0) {
      VSync(0);
    }
    DAT_80071888 = CStack_20.pos;
    FUN_8002d818("\\XASECT.BIN;1",&DAT_80089218,0x800,0);
    uVar2 = 1;
  }
  return uVar2;
}


/* 800173ac */

undefined4 FUN_800173ac(void)

{
  FUN_8001807c();
  FUN_800185d4();
  FUN_80017b08(0);
  VSync(0);
  VSync(0);
  VSync(0);
  FUN_8004a988();
  FUN_80017410();
  FUN_80017b90(0);
  return 1;
}


/* 80017410 */

void FUN_80017410(void)

{
  int iVar1;
  int iVar2;
  
  iVar2 = 0;
  iVar1 = 0;
  do {
    *(undefined2 *)((int)&DAT_800891a8 + iVar1) = 0xffff;
    iVar2 = iVar2 + 1;
    iVar1 = iVar2 * 2;
  } while (iVar2 < 9);
  iVar2 = 0;
  iVar1 = 0;
  do {
    *(undefined2 *)((int)&DAT_800891c8 + iVar1) = 0xffff;
    (&DAT_800891ca)[iVar1] = 0xff;
    iVar2 = iVar2 + 1;
    iVar1 = iVar2 * 4;
  } while (iVar2 < 8);
  iVar2 = 0;
  iVar1 = 0;
  do {
    *(undefined2 *)((int)&DAT_8006d798 + iVar1) = 0xffff;
    iVar2 = iVar2 + 1;
    iVar1 = iVar2 * 2;
  } while (iVar2 < 2);
  DAT_8006d79c = 2;
  DAT_8006d7a0 = 0xff;
  memset((uchar *)&DAT_800891e8,'\0',0x28);
  DAT_8007185c = 1;
  FUN_800179d4(0);
  FUN_80017aa0(0x40);
  memset(&DAT_80071868,'\0',0x20);
  DAT_80071868 = 0xff;
  DAT_80071869 = 0xff;
  DAT_8007186a = 0xff;
  DAT_80071878 = 0xff;
  DAT_80071879 = 0xff;
  DAT_8007187a = 0xff;
  DAT_80071894 = 0;
  DAT_8007189c = 0;
  DAT_80071890 = 0;
  FUN_80017ad4(DAT_80071864);
  FUN_80017a14(DAT_80071862);
  return;
}


/* 8001756c */

void FUN_8001756c(void)

{
  short sVar1;
  int iVar2;
  undefined2 extraout_var;
  int iVar3;
  int iVar4;
  u_char auStack_28 [5];
  u_char local_23;
  u_char local_22;
  u_char local_21;
  DslLOC local_20 [2];
  
  iVar4 = 0;
  iVar2 = 0;
  do {
    if (*(short *)((int)&DAT_80071872 + iVar2) != 0) {
      iVar3 = iVar4 * 0x10;
      if (*(short *)((int)&DAT_80071870 + iVar2) == 0) {
        *(undefined2 *)((int)&DAT_80071870 + iVar2) = 1;
      }
      if ((ushort)(&DAT_80071870)[iVar4 * 8] == 0) {
        trap(7);
      }
      (&DAT_8007186a)[iVar3] =
           (&DAT_8007186d)[iVar3] -
           (char)((int)(((uint)(byte)(&DAT_8007186d)[iVar3] - (uint)(byte)(&DAT_8007186c)[iVar3]) *
                       (uint)(ushort)(&DAT_80071872)[iVar4 * 8]) /
                 (int)(uint)(ushort)(&DAT_80071870)[iVar4 * 8]);
      if (iVar4 == 0) {
        FUN_8004ec60((int)(short)(&DAT_8006d798)[DAT_8006d79c],
                     (int)((((uint)DAT_80071868 * (uint)DAT_8007186a) / 0xff) * 0x8000) >> 0x10,
                     (int)((((uint)DAT_80071869 * (uint)DAT_8007186a) / 0xff) * 0x8000) >> 0x10);
LAB_800176ec:
        iVar2 = iVar4 << 4;
      }
      else {
        iVar2 = iVar4 * 0x10;
        if (iVar4 == 1) {
          FUN_800194d8(DAT_8007187a);
          goto LAB_800176ec;
        }
      }
      sVar1 = *(short *)((int)&DAT_80071872 + iVar2) + -1;
      *(short *)((int)&DAT_80071872 + iVar2) = sVar1;
      if (sVar1 == 0) {
        if ((&DAT_8007186b)[iVar2] != '\0') {
          if (iVar4 == 0) {
            FUN_8001807c();
          }
          else if (iVar4 == 1) {
            FUN_80017c18();
          }
        }
        if ((code *)(&DAT_80071874)[iVar4 * 4] != (code *)0x0) {
          (*(code *)(&DAT_80071874)[iVar4 * 4])();
        }
      }
    }
    iVar4 = iVar4 + 1;
    iVar2 = iVar4 * 0x10;
  } while (iVar4 < 2);
  if (DAT_800891e8 == 2) {
    sVar1 = SsVabTransCompleted(0);
    if (CONCAT22(extraout_var,sVar1) == 0) {
      return;
    }
    if (DAT_800891ec != 0) {
      FUN_8002dfe4();
    }
    DAT_800891ec = 0;
    if (DAT_8008920c != (code *)0x0) {
      (*DAT_8008920c)(0);
    }
    DAT_800891e8 = 0;
  }
  iVar2 = FUN_8003d168(1,auStack_28);
  switch(DAT_80071890) {
  case 1:
    iVar2 = DsPosToInt((DslLOC *)&DAT_8007188c);
    FUN_8002db98(iVar2,&LAB_80019e84,0);
    DAT_80071890 = 2;
    break;
  case 3:
    if (iVar2 == 2) {
      FUN_80019f04();
      DAT_80071890 = 4;
      return;
    }
    goto LAB_800178d0;
  case 4:
    if (iVar2 == 2) {
      DAT_80071890 = 5;
      if (DAT_8007189c == (code *)0x0) {
        DAT_80071890 = 5;
        return;
      }
      (*DAT_8007189c)(0);
      return;
    }
LAB_800178d0:
    DAT_80071890 = 1;
    break;
  case 6:
  case 7:
    CdControlB('\x11',auStack_28,(u_char *)0x0);
    local_20[0].minute = local_23;
    local_20[0].second = local_22;
    local_20[0].sector = local_21;
    local_20[0].track = '\0';
    iVar2 = DsPosToInt(local_20);
    iVar4 = DsPosToInt((DslLOC *)&DAT_8007188c);
    if (iVar4 + DAT_80071898 <= iVar2) {
      FUN_80017c18();
    }
  }
  return;
}


/* 8001796c */

bool FUN_8001796c(void)

{
  return DAT_800891e8 != 0;
}


/* 8001797c */

void FUN_8001797c(int param_1)

{
  if (param_1 == 0) {
    FUN_80054148();
  }
  else {
    FUN_80054158();
  }
  DAT_8007185c = param_1;
  return;
}


/* 800179d4 */

void FUN_800179d4(byte param_1)

{
  DAT_80071858 = param_1;
  SsSetMVol((ushort)(param_1 >> 1),(ushort)(param_1 >> 1));
  return;
}


/* 80017a14 */

bool FUN_80017a14(ushort param_1)

{
  param_1 = param_1 & 0xff;
  if (param_1 < 10) {
    SsSetRVol((ushort)(DAT_8007185a >> 1),(ushort)(DAT_8007185a >> 1));
    SsUtSetReverbType(param_1);
    SsUtSetReverbDepth((ushort)(DAT_8007185b >> 1),(ushort)(DAT_8007185b >> 1));
    FUN_8004fea8();
  }
  return param_1 < 10;
}


/* 80017aa0 */

void FUN_80017aa0(byte param_1)

{
  DAT_8007185a = param_1;
  SsSetRVol((ushort)(param_1 >> 1),(ushort)(param_1 >> 1));
  return;
}


/* 80017ad4 */

void FUN_80017ad4(byte param_1)

{
  DAT_8007185b = param_1;
  SsUtSetReverbDepth((ushort)(param_1 >> 1),(ushort)(param_1 >> 1));
  return;
}


/* 80017b08 */

undefined4 FUN_80017b08(undefined1 param_1)

{
  DAT_8007187a = param_1;
  FUN_800194d8();
  DAT_80071882 = 0;
  return 1;
}


/* 80017b50 */

void FUN_80017b50(undefined1 param_1,undefined1 param_2,undefined2 param_3,undefined4 param_4)

{
  FUN_800199fc(1,param_1,param_2,param_3,param_4,0);
  return;
}


/* 80017b90 */

undefined4 FUN_80017b90(short param_1)

{
  undefined1 local_10 [4];
  undefined1 local_c [4];
  
  if (DAT_8007185c == 1) {
    FUN_80019ab0(0xff,(int)param_1,local_10,local_c);
    DAT_80071878 = local_10[0];
    DAT_80071879 = local_c[0];
  }
  else {
    DAT_80071878 = 0xff;
    DAT_80071879 = 0xff;
  }
  FUN_800194d8(DAT_8007187a);
  return 1;
}


/* 80017c18 */

undefined4 FUN_80017c18(void)

{
  CdControl('\t',(u_char *)0x0,(u_char *)0x0);
  FUN_80017b08(0);
  DAT_80071890 = 0;
  return 1;
}


/* 80017c54 */

undefined4 FUN_80017c54(undefined4 param_1,undefined4 param_2)

{
  int iVar1;
  undefined4 uVar2;
  
  iVar1 = FUN_80017c9c(param_1,param_2,0);
  uVar2 = 0;
  if (iVar1 != 0) {
    while( true ) {
      iVar1 = FUN_8001796c();
      uVar2 = 1;
      if (iVar1 == 0) break;
      VSync(0);
    }
  }
  return uVar2;
}


/* 80017c9c */

undefined4 FUN_80017c9c(uint param_1,uint param_2,undefined4 param_3)

{
  int iVar1;
  undefined4 uVar2;
  
  if (param_2 < DAT_8006d6b0) {
    if (1 < param_1) {
      return 0;
    }
    iVar1 = FUN_8001796c();
    if (iVar1 == 0) {
      if (DAT_800891ec != 0) {
        return 0;
      }
      if (DAT_8006d79c == param_1) {
        FUN_8001807c();
      }
      DAT_8006d7a0 = *(undefined4 *)(&UNK_80065330 + param_2 * 4);
      uVar2 = FUN_8001827c(param_2);
      if (param_1 == 0) {
        uVar2 = FUN_800198e0(uVar2,0x2f50,0x1ec00,0,0,0x2800,0,0x4400,param_3);
        return uVar2;
      }
      uVar2 = FUN_800198e0(uVar2,0x21b50,0x400,1,0,0x400,0x4400,0x400,param_3);
      return uVar2;
    }
  }
  return 0;
}


/* 80017dc4 */

undefined4 FUN_80017dc4(uint param_1,int param_2,undefined4 param_3)

{
  int iVar1;
  
  if (param_2 != 0) {
    if (1 < param_1) {
      return 0;
    }
    iVar1 = FUN_8001796c();
    if (iVar1 != 0) {
      return 0;
    }
    if (DAT_8006d79c == param_1) {
      FUN_8001807c();
    }
    if (param_1 != 0) {
      DAT_800891f4 = 0x21b50;
      DAT_800891f8 = 0x2800;
      DAT_800891fc = 0x4400;
    }
    else {
      DAT_800891f4 = 0x2f50;
      DAT_800891f8 = 0;
      DAT_800891fc = 0;
    }
    DAT_80089208 = 0x4400;
    DAT_80089204 = 0x2800;
    DAT_80089200 = 0x1ec00;
    DAT_800891f0 = (uint)(param_1 != 0);
    DAT_800891ec = 0;
    DAT_8008920c = param_3;
    iVar1 = FUN_80019ca4(param_2);
    if (iVar1 == 0) {
      DAT_800891e8 = 2;
      return 1;
    }
  }
  return 0;
}


/* 80017ee0 */

void FUN_80017ee0(undefined4 param_1,undefined4 param_2)

{
  FUN_80017f04(param_1,0,param_2);
  return;
}


/* 80017f04 */

undefined4 FUN_80017f04(uint param_1,undefined4 param_2,int param_3)

{
  ushort uVar1;
  int iVar2;
  ulong *puVar3;
  undefined4 uVar4;
  
  if (param_1 < 2) {
    if ((short)(&DAT_800891a8)[param_1] < 0) {
      return 0;
    }
    FUN_8001807c();
    iVar2 = FUN_8001e3e0(&UNK_80082ca8 + param_1);
    if (iVar2 < 1) {
      puVar3 = (ulong *)(&UNK_80082ca8 + param_1);
    }
    else {
      puVar3 = (ulong *)FUN_8001e50c(param_2,&UNK_80082ca8 + param_1);
      if (puVar3 == (ulong *)0x0) goto LAB_80017f88;
    }
    uVar1 = SsSeqOpen(puVar3,(&DAT_800891a8)[param_1]);
    (&DAT_8006d798)[param_1] = uVar1;
    uVar4 = 0;
    if (-1 < (int)((uint)uVar1 << 0x10)) {
      if (param_3 == 0) {
        SsSeqPlay((&DAT_8006d798)[param_1],'\x01',1);
      }
      else {
        SsSeqPlay((&DAT_8006d798)[param_1],'\x01',0);
      }
      uVar4 = 1;
      DAT_8006d79c = param_1;
    }
  }
  else {
LAB_80017f88:
    uVar4 = 0;
  }
  return uVar4;
}


/* 8001807c */

bool FUN_8001807c(void)

{
  bool bVar1;
  
  bVar1 = DAT_8006d79c < 2;
  if (bVar1) {
    FUN_8001811c(0);
    SsSeqStop((&DAT_8006d798)[DAT_8006d79c]);
    SsSeqClose((&DAT_8006d798)[DAT_8006d79c]);
    (&DAT_8006d798)[DAT_8006d79c] = 0xffff;
    DAT_8006d79c = 2;
  }
  return bVar1;
}


/* 8001811c */

bool FUN_8001811c(byte param_1)

{
  int iVar1;
  
  iVar1 = (int)(short)(&DAT_8006d798)[DAT_8006d79c];
  if (-1 < iVar1) {
    DAT_80071872 = 0;
    DAT_8007186a = param_1;
    FUN_8004ec60(iVar1,param_1 >> 1);
  }
  return -1 < iVar1;
}


/* 80018180 */

/* Possible S_003.OBJ/CdStatus
   Possible S_004.OBJ/CdMode
   Possible S_005.OBJ/CdLastCom */

undefined1 FUN_80018180(void)

{
  return DAT_8007186a;
}


/* 800181fc */

undefined4 FUN_800181fc(undefined1 param_1,undefined1 param_2,undefined2 param_3,undefined4 param_4)

{
  undefined4 uVar1;
  
  if ((short)(&DAT_8006d798)[DAT_8006d79c] < 0) {
    uVar1 = 0;
  }
  else {
    uVar1 = FUN_800199fc(0,param_1,param_2,param_3,param_4,1);
  }
  return uVar1;
}


/* 8001827c */

undefined4 FUN_8001827c(uint param_1)

{
  if (param_1 < 0x1f) {
    return (&DAT_800652b0)[param_1];
  }
  return 0xffffffff;
}


/* 800182d4 */

undefined1 FUN_800182d4(uint param_1)

{
  if ((param_1 & 0xff) < 0x1f) {
    return (&UNK_800653cc)[param_1 & 0xff];
  }
  return 0;
}


/* 80018300 */

undefined4 FUN_80018300(uint param_1,int param_2,undefined4 param_3,uint param_4,short param_5)

{
  short sVar1;
  int iVar2;
  ulong *puVar3;
  
  if (param_1 < 0x6500) {
    if (7 < param_4) {
      return 0;
    }
    iVar2 = FUN_8001e3e0(0);
    if (iVar2 != 0) {
      return 0;
    }
    if (-1 < (short)(&DAT_800891a8)[param_2]) {
      puVar3 = (ulong *)FUN_8001e50c(param_3,&UNK_80082ca8 + param_1);
      if (puVar3 == (ulong *)0x0) {
        puVar3 = (ulong *)(&UNK_80082ca8 + param_1);
      }
      FUN_80018568(param_4);
      sVar1 = SsSeqOpen(puVar3,(&DAT_800891a8)[param_2]);
      (&DAT_800891c8)[param_4 * 2] = sVar1;
      if (-1 < sVar1) {
        SsSeqPlay(sVar1,'\x01',param_5);
        return 1;
      }
    }
  }
  return 0;
}


/* 80018468 */

undefined4 FUN_80018468(uint param_1,byte param_2)

{
  short sVar1;
  
  if (param_1 < 8) {
    sVar1 = (&DAT_800891c8)[param_1 * 2];
    if (-1 < sVar1) {
      (&DAT_800891ca)[param_1 * 4] = param_2;
      FUN_8004ec60((int)sVar1,param_2 >> 1);
      return 1;
    }
  }
  return 0;
}


/* 80018508 */

undefined4 FUN_80018508(uint param_1,short param_2)

{
  undefined4 uVar1;
  
  if (param_1 < 8) {
    if (-1 < (short)(&DAT_800891c8)[param_1 * 2]) {
      uVar1 = FUN_80019b9c((int)(short)(&DAT_800891c8)[param_1 * 2],(&DAT_800891ca)[param_1 * 4],
                           (int)param_2);
      return uVar1;
    }
  }
  return 0;
}


/* 80018568 */

undefined4 FUN_80018568(uint param_1)

{
  short *psVar1;
  
  if (param_1 < 8) {
    psVar1 = &DAT_800891c8 + param_1 * 2;
    if (-1 < *psVar1) {
      SsSeqStop(*psVar1);
      SsSeqClose(*psVar1);
      *psVar1 = -1;
      return 1;
    }
  }
  return 0;
}


/* 800185d4 */

void FUN_800185d4(void)

{
  int iVar1;
  
  iVar1 = 0;
  do {
    FUN_80018568(iVar1);
    iVar1 = iVar1 + 1;
  } while (iVar1 < 8);
  return;
}


/* 8001860c */

undefined4 FUN_8001860c(uint param_1)

{
  undefined4 uVar1;
  
  uVar1 = 0;
  if ((param_1 & 0xff) < 0xd) {
    FUN_800185d4();
    uVar1 = FUN_80019878((param_1 & 0xff) + 0x5c6,0x27750,0x20000,3,0x4c00,0x2000,0x4c00,0x400);
  }
  return uVar1;
}


/* 80018674 */

undefined4 FUN_80018674(uint param_1)

{
  undefined4 uVar1;
  
  uVar1 = 0;
  if ((param_1 & 0xff) < 0xd) {
    FUN_800185d4();
    uVar1 = FUN_80019878((param_1 & 0xff) + 0x5ba,0x37750,0x40000,4,0x6c00,0x2000,0x5000,0x400);
  }
  return uVar1;
}


/* 800186e0 */

void FUN_800186e0(void)

{
  FUN_800185d4();
  FUN_80019878(0x5b8,0x27750,0x10000,3,0x4c00,0x2000,0x4c00,0x400);
  return;
}


/* 80018734 */

undefined4 FUN_80018734(int param_1,undefined4 param_2)

{
  undefined4 uVar1;
  
  uVar1 = 0;
  if (DAT_800891ec == 0) {
    uVar1 = FUN_800198e0(*(undefined2 *)(&UNK_800653ec + param_1 * 2),0x37750,0x40000,4,0x6c00,
                         0x2000,0x5000,0x400,param_2);
  }
  return uVar1;
}


/* 80018800 */

void FUN_80018800(void)

{
  FUN_80019b9c();
  return;
}


/* 80018cb8 */

undefined4 FUN_80018cb8(int param_1,undefined4 param_2,undefined4 param_3)

{
  undefined4 uVar1;
  
  if (DAT_800891ec == 0) {
    uVar1 = FUN_80019048(param_2,param_1);
    if (param_1 == 0) {
      uVar1 = FUN_800198e0(uVar1,0x37f50,0xc000,4,0xa800,0x1c00,0x5800,0x400,param_3);
    }
    else {
      uVar1 = FUN_800198e0(uVar1,0x43f50,0xc000,5,0xc400,0x1c00,0x5c00,0x400,param_3);
    }
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


/* 80018e1c */

undefined4 FUN_80018e1c(int param_1,uint param_2,uint param_3,undefined4 param_4)

{
  undefined1 uVar1;
  int iVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  
  uVar4 = 0;
  if (DAT_800891ec != 0) {
    return 0;
  }
  iVar2 = FUN_80019088(param_2);
  if (param_1 == 1) {
    uVar5 = 0xf000;
    uVar6 = 0x6080;
    uVar4 = 0x5df50;
    uVar3 = 7;
  }
  else if (param_1 == 0) {
    uVar5 = 0xe000;
    uVar6 = 0x6000;
    uVar4 = 0x4ff50;
    uVar3 = 6;
  }
  else {
    if (param_1 != 2) {
      if (param_1 == 3) {
        return 0;
      }
      goto LAB_80018f4c;
    }
    uVar5 = 0x10000;
    uVar6 = 0x6100;
    uVar4 = 0x6bf50;
    uVar3 = 8;
  }
  uVar4 = FUN_800198e0(iVar2 + param_3,uVar4,0xe000,uVar3,uVar5,0x1000,uVar6,0x80,param_4);
LAB_80018f4c:
  uVar1 = FUN_80019830(param_2 & 0xff,param_3 & 0xff);
  (&DAT_8006d7a4)[param_1] = uVar1;
  return uVar4;
}


/* 80019048 */

uint FUN_80019048(uint param_1,int param_2)

{
  if (param_1 < 0xd) {
    return (uint)*(ushort *)(&DAT_80065430 + (param_2 * 0xd + param_1) * 2);
  }
  return 0xffffffff;
}


/* 80019088 */

uint FUN_80019088(uint param_1)

{
  if (param_1 < 0xe) {
    return (uint)*(ushort *)(&DAT_80065464 + param_1 * 2);
  }
  return 0xffffffff;
}


/* 80019188 */

bool FUN_80019188(void)

{
  return DAT_80071890 == 0;
}


/* 800191b0 */

undefined4 FUN_800191b0(undefined4 param_1,undefined4 param_2)

{
  int iVar1;
  undefined4 uVar2;
  DslLOC *pDVar3;
  
  iVar1 = FUN_80019188();
  uVar2 = 0;
  if (iVar1 != 0) {
    DAT_80071894 = FUN_800194d0(param_1);
    iVar1 = FUN_80019468(param_1);
    pDVar3 = DsIntToPos(iVar1,(DslLOC *)&DAT_8007188c);
    if (pDVar3 == (DslLOC *)0x0) {
      uVar2 = 0;
    }
    else {
      DAT_80071898 = FUN_800194b8(param_1);
      DAT_80071890 = 1;
      DAT_8007189c = param_2;
      FUN_80019468(param_1);
      FUN_800194b8(param_1);
      uVar2 = 1;
    }
  }
  return uVar2;
}


/* 800192c8 */

bool FUN_800192c8(void)

{
  bool bVar1;
  
  bVar1 = DAT_80071890 == 6;
  if (bVar1) {
    FUN_80017b50(0xff,0,5,&LAB_80019324);
    DAT_80071890 = 7;
  }
  return bVar1;
}


/* 80019358 */

bool FUN_80019358(void)

{
  return DAT_80071890 - 6U < 2;
}


/* 80019394 */

void FUN_80019394(void)

{
  DAT_80071890 = 0;
  return;
}


/* 800193a0 */

void FUN_800193a0(uint param_1,uint param_2,uint param_3,undefined4 param_4)

{
  FUN_800191b0((uint)(byte)(&DAT_80064d1c)[(param_1 & 0xff) + (param_2 & 0xff)] * 0x10 +
               (param_3 & 0xff) + -1,param_4);
  return;
}


/* 80019468 */

int FUN_80019468(uint param_1)

{
  int iVar1;
  
  iVar1 = DsPosToInt((DslLOC *)&DAT_80071888);
  return iVar1 + *(int *)(&DAT_8008921c + (param_1 >> 4) * 8);
}


/* 800194b8 */

int FUN_800194b8(int param_1)

{
  return (uint)(byte)(&DAT_80064d58)[param_1] << 4;
}


/* 800194d0 */

uint FUN_800194d0(uint param_1)

{
  return param_1 & 0xf;
}


/* 800194d8 */

void FUN_800194d8(uint param_1)

{
  DslATV local_10 [2];
  
  local_10[0].val0 = (u_char)((int)(((uint)DAT_80071878 * (param_1 & 0xff)) / 0xff) >> 1);
  local_10[0].val1 = '\0';
  local_10[0].val2 = (u_char)((int)(((uint)DAT_80071879 * (param_1 & 0xff)) / 0xff) >> 1);
  local_10[0].val3 = '\0';
  DsMix(local_10);
  return;
}


/* 800195ec */

void FUN_800195ec(undefined1 param_1)

{
  DAT_80071860 = param_1;
  return;
}


/* 80019608 */

void FUN_80019608(undefined1 param_1)

{
  DAT_80071861 = param_1;
  return;
}


/* 80019624 */

undefined4 FUN_80019624(byte param_1)

{
  if (param_1 < 10) {
    DAT_80071862 = param_1;
    return 1;
  }
  return 0;
}


/* 80019658 */

void FUN_80019658(undefined1 param_1)

{
  DAT_80071863 = param_1;
  return;
}


/* 80019674 */

void FUN_80019674(undefined1 param_1)

{
  DAT_80071864 = param_1;
  return;
}


/* 800196c4 */

void FUN_800196c4(void)

{
  uint uVar1;
  uint *puVar2;
  uint uVar3;
  uint *puVar4;
  uint uVar5;
  uint *puVar6;
  uint *puVar7;
  uint *puVar8;
  uint uVar9;
  uint in_t0;
  
  uVar3 = FUN_8002dbb8(0x5d2);
  puVar4 = (uint *)FUN_8002df30(uVar3);
  uVar9 = 0;
  puVar8 = puVar4;
  FUN_8002d7f8(0x5d2);
  puVar7 = &DAT_80089a18;
  puVar6 = puVar4;
  if (((uint)puVar4 & 3) == 0) {
    do {
      puVar8 = (uint *)*puVar6;
      uVar3 = puVar6[1];
      uVar9 = puVar6[2];
      uVar5 = puVar6[3];
      *puVar7 = (uint)puVar8;
      puVar7[1] = uVar3;
      puVar7[2] = uVar9;
      puVar7[3] = uVar5;
      puVar6 = puVar6 + 4;
      puVar7 = puVar7 + 4;
    } while (puVar6 != puVar4 + 0xd0);
  }
  else {
    do {
      uVar5 = (int)puVar6 + 3U & 3;
      uVar1 = (uint)puVar6 & 3;
      puVar8 = (uint *)((*(int *)(((int)puVar6 + 3U) - uVar5) << (3 - uVar5) * 8 |
                        (uint)puVar8 & 0xffffffffU >> (uVar5 + 1) * 8) & -1 << (4 - uVar1) * 8 |
                       *(uint *)((int)puVar6 - uVar1) >> uVar1 * 8);
      uVar5 = (int)puVar6 + 7U & 3;
      uVar1 = (uint)(puVar6 + 1) & 3;
      uVar3 = (*(int *)(((int)puVar6 + 7U) - uVar5) << (3 - uVar5) * 8 |
              uVar3 & 0xffffffffU >> (uVar5 + 1) * 8) & -1 << (4 - uVar1) * 8 |
              *(uint *)((int)(puVar6 + 1) - uVar1) >> uVar1 * 8;
      uVar5 = (int)puVar6 + 0xbU & 3;
      uVar1 = (uint)(puVar6 + 2) & 3;
      uVar9 = (*(int *)(((int)puVar6 + 0xbU) - uVar5) << (3 - uVar5) * 8 |
              uVar9 & 0xffffffffU >> (uVar5 + 1) * 8) & -1 << (4 - uVar1) * 8 |
              *(uint *)((int)(puVar6 + 2) - uVar1) >> uVar1 * 8;
      uVar5 = (int)puVar6 + 0xfU & 3;
      uVar1 = (uint)(puVar6 + 3) & 3;
      in_t0 = (*(int *)(((int)puVar6 + 0xfU) - uVar5) << (3 - uVar5) * 8 |
              in_t0 & 0xffffffffU >> (uVar5 + 1) * 8) & -1 << (4 - uVar1) * 8 |
              *(uint *)((int)(puVar6 + 3) - uVar1) >> uVar1 * 8;
      uVar5 = (int)puVar7 + 3U & 3;
      puVar2 = (uint *)(((int)puVar7 + 3U) - uVar5);
      *puVar2 = *puVar2 & -1 << (uVar5 + 1) * 8 | (uint)puVar8 >> (3 - uVar5) * 8;
      *puVar7 = (uint)puVar8;
      uVar5 = (int)puVar7 + 7U & 3;
      puVar2 = (uint *)(((int)puVar7 + 7U) - uVar5);
      *puVar2 = *puVar2 & -1 << (uVar5 + 1) * 8 | uVar3 >> (3 - uVar5) * 8;
      puVar7[1] = uVar3;
      uVar5 = (int)puVar7 + 0xbU & 3;
      puVar2 = (uint *)(((int)puVar7 + 0xbU) - uVar5);
      *puVar2 = *puVar2 & -1 << (uVar5 + 1) * 8 | uVar9 >> (3 - uVar5) * 8;
      puVar7[2] = uVar9;
      uVar5 = (int)puVar7 + 0xfU & 3;
      puVar2 = (uint *)(((int)puVar7 + 0xfU) - uVar5);
      *puVar2 = *puVar2 & -1 << (uVar5 + 1) * 8 | in_t0 >> (3 - uVar5) * 8;
      puVar7[3] = in_t0;
      puVar6 = puVar6 + 4;
      puVar7 = puVar7 + 4;
    } while (puVar6 != puVar4 + 0xd0);
  }
  uVar3 = (int)puVar6 + 3U & 3;
  uVar9 = (uint)puVar6 & 3;
  uVar5 = (*(int *)(((int)puVar6 + 3U) - uVar3) << (3 - uVar3) * 8 |
          (uint)(puVar4 + 0xd0) & 0xffffffffU >> (uVar3 + 1) * 8) & -1 << (4 - uVar9) * 8 |
          *(uint *)((int)puVar6 - uVar9) >> uVar9 * 8;
  uVar3 = (int)puVar6 + 7U & 3;
  uVar9 = (uint)(puVar6 + 1) & 3;
  uVar9 = (*(int *)(((int)puVar6 + 7U) - uVar3) << (3 - uVar3) * 8 |
          (uint)puVar8 & 0xffffffffU >> (uVar3 + 1) * 8) & -1 << (4 - uVar9) * 8 |
          *(uint *)((int)(puVar6 + 1) - uVar9) >> uVar9 * 8;
  uVar3 = (int)puVar7 + 3U & 3;
  puVar8 = (uint *)(((int)puVar7 + 3U) - uVar3);
  *puVar8 = *puVar8 & -1 << (uVar3 + 1) * 8 | uVar5 >> (3 - uVar3) * 8;
  *puVar7 = uVar5;
  uVar3 = (int)puVar7 + 7U & 3;
  puVar8 = (uint *)(((int)puVar7 + 7U) - uVar3);
  *puVar8 = *puVar8 & -1 << (uVar3 + 1) * 8 | uVar9 >> (3 - uVar3) * 8;
  puVar7[1] = uVar9;
  FUN_8002dfe4(puVar4);
  return;
}


/* 80019830 */

undefined1 FUN_80019830(uint param_1,uint param_2)

{
  if (((param_1 & 0xff) < 0xe) && ((param_2 & 0xff) < 0x3c)) {
    return *(undefined1 *)((int)&DAT_80089a18 + (param_1 & 0xff) * 0x3c + (param_2 & 0xff));
  }
  return 0;
}


/* 80019878 */

undefined4 FUN_80019878(void)

{
  int iVar1;
  undefined4 uVar2;
  
  iVar1 = FUN_800198e0();
  uVar2 = 0;
  if (iVar1 != 0) {
    while( true ) {
      iVar1 = FUN_8001796c();
      uVar2 = 1;
      if (iVar1 == 0) break;
      VSync(0);
    }
  }
  return uVar2;
}


/* 800198e0 */

undefined4
FUN_800198e0(undefined4 param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4,
            undefined4 param_5,undefined4 param_6,undefined4 param_7,undefined4 param_8,
            undefined4 param_9)

{
  int iVar1;
  
  iVar1 = FUN_8002dbb8();
  if ((-1 < iVar1) && (DAT_800891ec = FUN_8002df30(iVar1), DAT_800891ec != 0)) {
    iVar1 = FUN_8002d838(param_1,DAT_800891ec,iVar1,FUN_80019c10,0);
    if (iVar1 != 0) {
      DAT_800891e8 = 1;
      DAT_800891f0 = param_4;
      DAT_800891f4 = param_2;
      DAT_800891f8 = param_5;
      DAT_800891fc = param_7;
      DAT_80089200 = param_3;
      DAT_80089204 = param_6;
      DAT_80089208 = param_8;
      DAT_8008920c = param_9;
      return 1;
    }
    FUN_8002dfe4(DAT_800891ec);
    DAT_800891ec = 0;
  }
  return 0;
}


/* 800199fc */

undefined4
FUN_800199fc(uint param_1,undefined1 param_2,undefined1 param_3,undefined2 param_4,
            undefined4 param_5,undefined1 param_6)

{
  int iVar1;
  
  param_1 = param_1 & 0xff;
  if (param_1 == 0) {
    FUN_8001811c(param_2);
  }
  else {
    if (param_1 != 1) {
      return 0;
    }
    FUN_80017b08(param_2);
  }
  iVar1 = param_1 * 0x10;
  (&DAT_8007186c)[iVar1] = param_2;
  (&DAT_8007186d)[iVar1] = param_3;
  (&DAT_8007186b)[iVar1] = param_6;
  (&DAT_80071870)[param_1 * 8] = param_4;
  (&DAT_80071872)[param_1 * 8] = param_4;
  (&DAT_80071874)[param_1 * 4] = param_5;
  return 1;
}


/* 80019ab0 */

undefined4 FUN_80019ab0(uint param_1,short param_2,short *param_3,short *param_4)

{
  short sVar1;
  int iVar2;
  uint uVar3;
  short sVar4;
  
  param_1 = param_1 & 0xff;
  iVar2 = (int)param_2;
  if ((param_3 == (short *)0x0) || (param_4 == (short *)0x0)) {
    return 0;
  }
  if (iVar2 < -0x80) {
    iVar2 = -0x80;
  }
  else if (0x7f < iVar2) {
    iVar2 = 0x7f;
  }
  if (param_1 == 0) {
    *param_3 = 0;
  }
  else {
    sVar4 = (short)param_1;
    if (iVar2 < 0) {
      uVar3 = (int)(param_1 * -iVar2 * 2) / 0xff;
      *param_3 = sVar4;
      if ((int)param_1 < (int)uVar3) {
        uVar3 = param_1;
      }
      *param_4 = sVar4 - (short)uVar3;
    }
    else {
      iVar2 = (int)(param_1 * iVar2 * 2) / 0xff;
      sVar1 = sVar4 - (short)iVar2;
      if ((int)param_1 < iVar2) {
        sVar1 = 0;
      }
      *param_3 = sVar1;
      *param_4 = sVar4;
    }
  }
  return 1;
}


/* 80019b9c */

bool FUN_80019b9c(short param_1,undefined1 param_2,short param_3)

{
  int iVar1;
  ushort local_10;
  ushort local_e [3];
  
  iVar1 = (int)param_1;
  if (-1 < iVar1) {
    FUN_80019ab0(param_2,(int)param_3,&local_10,local_e);
    FUN_8004ec60(iVar1,(int)((uint)local_10 << 0x10) >> 0x11,(int)((uint)local_e[0] << 0x10) >> 0x11
                );
  }
  return -1 < iVar1;
}


/* 80019c10 */

undefined4 FUN_80019c10(void)

{
  int iVar1;
  
  iVar1 = FUN_80019ca4(DAT_800891ec);
  if (iVar1 != 0) {
    if (DAT_800891ec != 0) {
      FUN_8002dfe4();
    }
    DAT_800891ec = 0;
    DAT_800891e8 = 0;
    if (DAT_8008920c != (code *)0x0) {
      (*DAT_8008920c)(iVar1);
    }
  }
  DAT_800891e8 = 2;
  return 1;
}


/* 80019ca4 */

undefined4 FUN_80019ca4(undefined4 param_1)

{
  short sVar1;
  uchar *puVar2;
  uint uVar3;
  uchar *puVar4;
  uint uVar5;
  uchar *puVar6;
  uint uVar7;
  undefined2 extraout_var;
  
  puVar2 = (uchar *)FUN_8001e50c(0,param_1);
  uVar3 = FUN_8001e418(0,param_1);
  puVar4 = (uchar *)FUN_8001e50c(1,param_1);
  uVar5 = FUN_8001e418(1,param_1);
  puVar6 = (uchar *)FUN_8001e50c(2,param_1);
  uVar7 = FUN_8001e418(2,param_1);
  if (puVar2 != (uchar *)0x0) {
    if (puVar4 == (uchar *)0x0) {
      return 1;
    }
    if ((puVar6 != (uchar *)0x0) && (uVar7 <= DAT_80089208)) {
      if (DAT_80089200 < uVar5) {
        return 1;
      }
      if (DAT_80089204 < uVar3) {
        return 1;
      }
      memcpy(&UNK_800718a8 + DAT_800891f8,puVar2,uVar3);
      SsVabClose((short)DAT_800891f0);
      sVar1 = SsVabOpenHeadSticky(&UNK_800718a8 + DAT_800891f8,(short)DAT_800891f0,DAT_800891f4);
      (&DAT_800891a8)[DAT_800891f0] = sVar1;
      if (sVar1 == -1) {
        return 2;
      }
      sVar1 = SsVabTransBody(puVar4,(&DAT_800891a8)[DAT_800891f0]);
      if (CONCAT22(extraout_var,sVar1) == -1) {
        return 3;
      }
      memcpy(&UNK_80082ca8 + DAT_800891fc,puVar6,uVar7);
      return 0;
    }
  }
  return 1;
}


/* 80019ec0 */

bool FUN_80019ec0(void)

{
  int iVar1;
  u_char local_10;
  undefined1 local_f;
  
  local_10 = '\x01';
  local_f = (undefined1)DAT_80071894;
  iVar1 = CdControl('\r',&local_10,(u_char *)0x0);
  return iVar1 != 0;
}


/* 80019f04 */

bool FUN_80019f04(void)

{
  int iVar1;
  u_char local_10 [8];
  
  local_10[0] = 200;
  iVar1 = CdControl('\x0e',local_10,(u_char *)0x0);
  return iVar1 != 0;
}


/* 80019f38 */

void FUN_80019f38(void)

{
  memset(&DAT_80089d60,'\0',0x54);
  DAT_80089d9c = 1;
  return;
}


