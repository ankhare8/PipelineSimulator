/** A program that simualtes a piplined data path
 * Assumptions: The only instructions that will be given to the simulator are add, sub, sb and lb, 
 * @author Anshita Khare
 * */
class Pipeline {
    #Main_Mem;
    #Registers;
    #PL;

    //R-TYPE AND I-TYPE SHARED BITMASKS
        //OP Code Bitmask
        static OPBM = 0xFC000000;

        //SRC 1 Bitmask
        static SRC1BM = 0x03E00000;

        //SRC 2 or Destination Bitmask
        static SRC2DESTBM = 0x001F0000;
	
    //R-TYPE SPECIFIC BITMASKS
        //Desination Bitmask
        static DESTBM =  0x0000F800;

        //Function Bitmask
        static FUNCBM = 0x00000003F;

    //I-TYPE SPECIFIC BITMASK
        //Offset/Constant Bitmask
        static OFFSBM = 0x0000FFFF;

    constructor(){
        this.#Main_Mem = new Int16Array(1024);
        this.mainMemInit();

        this.#Registers = new Int16Array(32);
        this.registerInit();

        this.#PL = new Pipeline_Registers();
    }

    mainMemInit(){
        for (let i = 1; i < this.#Main_Mem.length; i++){
            this.#Main_Mem[i] = i;
        }
    }
    registerInit(){
        for (let i = 1; i < this.#Registers.length; i++){
            this.#Registers[i] = 0x100 + i;
        }
    }


    IF_stage( hexInstruction ){
        this.#PL.IF_ID_Write.Instruction = hexInstruction;
        this.#PL.IF_ID_Write.IncrPC += 4;
    } 

    ID_stage(){
        const hexInstruction = this.#PL.IF_ID_Read.Instruction;

        const opcode = (hexInstruction & Pipeline.OPBM) >>> 26

        switch (opcode) {
            //R-Format Instruction
            case 0:{
                // If not NOP
                if(hexInstruction != 0x00000000){
                      // Set the control bits
                      this.#PL.ID_EX_Write.Control.RegDst = 1; // Set to 1 so that the write register comes from the rd feilds(15-11)
                      this.#PL.ID_EX_Write.Control.ALUSrc = 0; // 2nd ALU operand comes from reg2 output(read data 2)
                      this.#PL.ID_EX_Write.Control.ALUOp = 10; 
                      this.#PL.ID_EX_Write.Control.MemRead = 0;
                      this.#PL.ID_EX_Write.Control.MemWrite = 0;
                      this.#PL.ID_EX_Write.Control.Branch = 0;
                      this.#PL.ID_EX_Write.Control.MemToReg = 0;
                      this.#PL.ID_EX_Write.Control.RegWrite = 1;    
                } else{
                    // 0 all control bits and pipeline registers
                    this.setAllPropertiesToValue(this.#PL.ID_EX_Write, 0);
                }
                break;
            }


            // Load Byte
            case 32:{
                // Set the control bits
                    this.#PL.ID_EX_Write.Control.RegDst = 0;
                    this.#PL.ID_EX_Write.Control.ALUSrc = 1; //Set ALUSrc to 1 so that the sign extended, lower 16 bits of the instruction will be the second ALU operand
                    this.#PL.ID_EX_Write.Control.ALUOp = 0;
                    this.#PL.ID_EX_Write.Control.MemRead = 1; //Set MemRead to 1 because we are reading memory
                    this.#PL.ID_EX_Write.Control.MemWrite = 0;
                    this.#PL.ID_EX_Write.Control.Branch = 0; 
                    this.#PL.ID_EX_Write.Control.MemToReg = 1; //Set MemToReg to 1 because the memory value, not ALU result, is going into register
                    this.#PL.ID_EX_Write.Control.RegWrite = 1; //Set RegWrite to 1 because we are writing to a register
                break;
            }
                
            // Store Byte
            case 40:{
                // this.#PL.ID_EX_Write.Control.RegDst = "X";
                this.#PL.ID_EX_Write.Control.ALUSrc = 1; //Set ALUSrc to 1 so that the sign extended, lower 16 bits of the instruction will be the second ALU operand
                this.#PL.ID_EX_Write.Control.ALUOp = 0;
                this.#PL.ID_EX_Write.Control.MemRead = 0;
                this.#PL.ID_EX_Write.Control.MemWrite = 1; //Set MemWrite to 1 because we are writing to memory
                this.#PL.ID_EX_Write.Control.Branch = 0;
                // this.#PL.ID_EX_Write.Control.MemToReg = "X";
                this.#PL.ID_EX_Write.Control.RegWrite = 0;  
            }
        }

        const src1 = (hexInstruction & Pipeline.SRC1BM) >>> 21;
        const src2 = (hexInstruction & Pipeline.SRC2DESTBM)>>> 16;

        this.#PL.ID_EX_Write.IncrPC = this.#PL.IF_ID_Read.IncrPC;;
        this.#PL.ID_EX_Write.ReadReg1Value = this.#Registers[src1];
        this.#PL.ID_EX_Write.ReadReg2Value = this.#Registers[src2];
        this.#PL.ID_EX_Write.SEOffset = this.toShort(hexInstruction & Pipeline.OFFSBM);
        this.#PL.ID_EX_Write.WriteReg_20_16 = (hexInstruction & Pipeline.SRC2DESTBM)>>> 16;
        this.#PL.ID_EX_Write.WriteReg_15_11 = (hexInstruction & Pipeline.DESTBM) >>> 11;
        this.#PL.ID_EX_Write.Function = hexInstruction & Pipeline.FUNCBM
    } 

    EX_stage() {
        this.#PL.EX_Mem_Write.Control.MemRead = this.#PL.ID_EX_Read.Control.MemRead;
        this.#PL.EX_Mem_Write.Control.MemWrite = this.#PL.ID_EX_Read.Control.MemWrite;
        this.#PL.EX_Mem_Write.Control.Branch = this.#PL.ID_EX_Read.Control.Branch;
        this.#PL.EX_Mem_Write.Control.MemToReg = this.#PL.ID_EX_Read.Control.MemToReg;
        this.#PL.EX_Mem_Write.Control.RegWrite = this.#PL.ID_EX_Read.Control.RegWrite;


        //If there is no branch, set the CalcBta and Zero to 0
        if( this.#PL.ID_EX_Read.Control.Branch === 0 ){
            this.#PL.EX_Mem_Write.CalcBTA = 0;
            this.#PL.EX_Mem_Write.Zero = 0;
        }


        // If R-Type, place ALU result in lower register
        if (this.#PL.ID_EX_Read.Control.RegDst == 1){
            this.#PL.EX_Mem_Write.WriteRegNum = this.#PL.ID_EX_Read.WriteReg_15_11; 
        } else {
            this.#PL.EX_Mem_Write.WriteRegNum = this.#PL.ID_EX_Read.WriteReg_20_16;
        }

        
        // If I-Type
        if(this.#PL.ID_EX_Read.Control.ALUOp === 10){
            //Add
            if ( this.#PL.ID_EX_Read.Function == 0x20 ) {
                this.#PL.EX_Mem_Write.ALUResult = this.#PL.ID_EX_Read.ReadReg1Value + this.#PL.ID_EX_Read.ReadReg2Value
            
            //Sub
            } else if ( this.#PL.ID_EX_Read.Function == 0x22 ) {
                this.#PL.EX_Mem_Write.ALUResult = this.#PL.ID_EX_Read.ReadReg1Value - this.#PL.ID_EX_Read.ReadReg2Value
            }
        }
            

        // if R-Type
        if(this.#PL.ID_EX_Read.Control.ALUOp == 0){

            //Find target memory address by adding the sign extended offset and the register
            this.#PL.EX_Mem_Write.ALUResult = this.#PL.ID_EX_Read.ReadReg1Value + this.#PL.ID_EX_Read.SEOffset;
            
        }


        this.#PL.EX_Mem_Write.SWValue = this.#PL.ID_EX_Read.ReadReg2Value
        
    } 
    
    MEM_stage() {
        this.#PL.Mem_WB_Write.Control.MemToReg = this.#PL.EX_Mem_Read.Control.MemToReg;
        this.#PL.Mem_WB_Write.Control.RegWrite = this.#PL.EX_Mem_Read.Control.RegWrite;

        //If LB
        if(this.#PL.EX_Mem_Read.Control.MemRead == 1){
            this.#PL.Mem_WB_Write.LWDataValue = this.#Main_Mem[this.#PL.EX_Mem_Read.ALUResult];

        //If SB
        } else if(this.#PL.EX_Mem_Read.Control.MemWrite == 1){
            this.#Main_Mem[this.#PL.EX_Mem_Read.ALUResult] = this.#PL.EX_Mem_Read.SWValue;
        }

        this.#PL.Mem_WB_Write.ALUResult = this.#PL.EX_Mem_Read.ALUResult;
        this.#PL.Mem_WB_Write.WriteRegNum = this.#PL.EX_Mem_Read.WriteRegNum;
        
    }
    
    WB_stage(){
        //R-Type
        if(this.#PL.Mem_WB_Read.Control.MemToReg == 0 && this.#PL.Mem_WB_Read.Control.RegWrite == 1){
            this.#Registers[this.#PL.Mem_WB_Read.WriteRegNum] = this.#PL.Mem_WB_Read.ALUResult
        
        //LB
        } else if (this.#PL.Mem_WB_Read.Control.MemToReg == 1 && this.#PL.Mem_WB_Read.Control.RegWrite == 1){
            this.#Registers[this.#PL.Mem_WB_Read.WriteRegNum] = this.#PL.Mem_WB_Read.LWDataValue
        }

    }
    
    Print_out_everything(){
        const stages = ["IF_ID_Write", "IF_ID_Read", "ID_EX_Write",
            "ID_EX_Read", "EX_Mem_Write", "EX_Mem_Read",
            "Mem_WB_Write", "Mem_WB_Read"];

        for (const stage of stages){
            console.log(`___${stage}____`);
            if (this.checkForNop(this.#PL[stage])){
                console.log("Control = 000000000");
            } else {
                // console.log(JSON.stringify(this.#PL[register],null,'     '));   
                console.log(this.printObj(this.#PL[stage]))
            }
            console.log("") 
        }

        console.log(`___User Registers____`);
        for (let i = 0; i < this.#Registers.length; i ++){
            console.log(`Reg $${i} = x${(this.#Registers[i]).toString(16).toUpperCase()} `)
        }
    }

    Copy_write_to_read() {
        this.#PL.IF_ID_Read =  JSON.parse(JSON.stringify(this.#PL.IF_ID_Write))
        this.#PL.ID_EX_Read =  JSON.parse(JSON.stringify(this.#PL.ID_EX_Write)) 
        this.#PL.EX_Mem_Read = JSON.parse(JSON.stringify(this.#PL.EX_Mem_Write)) 
        this.#PL.Mem_WB_Read = JSON.parse(JSON.stringify(this.#PL.Mem_WB_Write))
    }



    Cycle(instructionArr){ 
        for(let i = 0; i < instructionArr.length; i++){

            console.log(`--------------Clock Cycle ${i+1}--------------`);

            this.IF_stage(instructionArr[i]);
            this.ID_stage();
            this.EX_stage(); 
            this.MEM_stage(); 
            this.WB_stage();
            this.Print_out_everything();
            this.Copy_write_to_read();
        }
    }


    /** Helper function to turn number into short
     * @param {number} number 
    */
    toShort(number) {
        const int16 = new Int16Array(1)
        int16[0] = number
        return int16[0]
    }

    /** Helper function, only used by this program to 0 out objects in case of NOP
     * @param {*} obj the target object
     * @param {*} value the value we want to set all properties to*/
    setAllPropertiesToValue(obj, value) {
        for (let prop in obj) {
            if (typeof obj[prop] === 'object') {
                this.setAllPropertiesToValue(obj[prop], value);
            } else {
                obj[prop] = value;
            }
        }
    }

    /** Helper function, used to check for NOP to aid with formatting Print_out_everyting
     * @param {*} obj the target object*/
    checkForNop(obj){
        for (let prop in obj) {
            if (typeof obj[prop] === 'object') {
                if (!this.checkForNop(obj[prop])) {
                    return false;
                }
            } else {
                if (obj[prop] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /** Helper function used to print out object
     * @param {*} obj the target object */
    printObj(obj, indent = 0) {
        const result = [];

        for (const key in obj) {
            if (typeof obj[key] === 'object') {

                result.push(' '.repeat(indent) + key + ':');
                result.push(this.printObj(obj[key], indent + 4));

            } else if (typeof obj[key] === 'number') {
            // } else if (key === 'Instruction') {    

                result.push(' '.repeat(indent) + key + ': ' + obj[key].toString(16).toUpperCase());

            } else {

                result.push(' '.repeat(indent) + key + ': ' + obj[key]);
            }

            
        }

        return result.join('\n');
    }
}