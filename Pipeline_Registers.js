class Pipeline_Registers{
    IF_ID_Write = {
        Instruction: 0,
        IncrPC: 0,
    }

    IF_ID_Read = {
        Instruction: 0,
        IncrPC: 0,
    }

    ID_EX_Write = {
        Control: {
            RegDst: 0,
            ALUSrc: 0,
            ALUOp: 0,
            MemRead: 0,
            MemWrite: 0,
            Branch: 0,
            MemToReg:  0,
            RegWrite: 0
        },
        IncrPC: 0,
        ReadReg1Value: 0,
        ReadReg2Value: 0,
        SEOffset: 0,
        WriteReg_20_16: 0,
        WriteReg_15_11: 0,
        Function: 0
    }

    ID_EX_Read = {
        Control: {
            RegDst: 0,
            ALUSrc: 0,
            ALUOp: 0,
            MemRead: 0,
            MemWrite: 0,
            Branch: 0,
            MemToReg:  0,
            RegWrite: 0
        },
        IncrPC: 0,
        ReadReg1Value: 0,
        ReadReg2Value: 0,
        SEOffset: 0,
        WriteReg_20_16: 0,
        WriteReg_15_11: 0,
        Function: 0
    }


    EX_Mem_Write = {
        Control: {
            MemRead: 0, 
            MemWrite: 0, 
            Branch: 0, 
            MemToReg: 0, 
            RegWrite: 0
        },
        
        CalcBTA: 0,
        Zero: 0,
        ALUResult: 0,
        SWValue: 0,
        WriteRegNum: 0
    }

    EX_Mem_Read = {
        Control: {
            MemRead: 0, 
            MemWrite: 0, 
            Branch: 0, 
            MemToReg: 0, 
            RegWrite: 0
        },
        
        CalcBTA: 0,
        Zero: 0,
        ALUResult: 0,
        SWValue: 0,
        WriteRegNum: 0
    }

    Mem_WB_Write = {
        Control:{
            MemToReg: 0, 
            RegWrite: 0
        },
        LWDataValue: 0,
        ALUResult: 0,
        WriteRegNum: 0
    }

    Mem_WB_Read = {
        Control:{
            MemToReg: 0, 
            RegWrite: 0
        },
        LWDataValue: 0,
        ALUResult: 0,
        WriteRegNum: 0
    }
}