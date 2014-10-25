var mods = [];

/*
    This file contains the code for the 'interactive shell'
*/

/*
    Get len bytes from addr
*/
function get_bytes(aspace, addr, len){
    var retbuf = "";
    for(var i = 0; i < len; i++){
	//debug!
		
        hex = aspace[addr + i].toString(16)
        if(hex.length == 1){
            hex = "0" + hex;
        }
        retbuf = retbuf + hex;
    }
    return retbuf;
}

/*
    Read len bytes from addr
*/
function do_read(aspace, addr, len){
    try{
        var bytes = get_bytes(aspace, addr, len);
        sendcmsg("read", addr, bytes);
    }catch(e){
        logdbg("ReadError: " + e);
    }
}

/*
    Dump len bytes from addr to fname
*/
function do_dump(aspace, addr, len, fname){
    try{
	var j = 0;
	while (j<len){
	var bytes = get_bytes(aspace, addr+j, 0x1000);
	sendcmsg("dump", addr, bytes, fname);
	j=j+0x1000;
	//('%.*f' % (n + 1, f))[:-1]
	if (j%0x10000 == 0) { logdbg("Dumping... %"+(j/len*100).toString()) }
	}
        
        
    }catch(e){
        logdbg("ReadError: " + e);
    }
}

/*
    Disassemble len bytes from addr
    with given mode
*/
function do_dis(aspace, addr, len, mode){
    try{
        var bytes = get_bytes(aspace, addr, len);
        sendcmsg("dis", addr, bytes);
    }catch(e){
        logdbg("DisError: " + e);
    }
}


/*
    Resolve module from address
*/
function do_resolve(aspace,addr,ModuleName){
addr = do_search(aspace, addr, 0xFFFFFFFF, ModuleName);
var this_module = new sce_module(addr-4,aspace);
mods.push(this_module_info);
for(i=0;i<this_module.import_list.length;i++)
	{
	this_import = this_module.import_list[i];
	this_func_array = this_import.func_entry_table;
	modname = this_import.name;
	 sendcmsg("resolve", instr,modname);			
	}
}

/*
    Search for pattern in [begaddr, endaddr[
*/
function do_search(aspace, begaddr, endaddr, pattern){
    try{
        var score = 0;
        var found = -1;
        if(endaddr <= begaddr){
            logdbg("SearchError: <endaddr> must be > <begaddr>");
            return;
        }
        for(var i = begaddr; i < endaddr; i++){
           var cb = aspace[i]; 
           var tb = pattern[score].charCodeAt(0);
           if((i % 0x10000) == 0){
               logdbg("0x" + i.toString(16) + " ...");
           }
           if(cb == tb){
               score += 1;
               if(score == pattern.length){found = i - score + 1; break;}
           }else{
               score = 0;
           }
        }
        if(found == -1){
            logdbg("Pattern not found");
        }else{
            logdbg("Pattern " + pattern + " found at: 0x" + found.toString(16));
			return found;
        }
    }catch(e){
        logdbg("SearchError: " + e);
    }
}

/*
    Command Handler
*/
function shell(aspace){
    try{
        while(true){
            var cmd = getcmd();
            var cmd_s = cmd.split(" ");
            // exit
            if(cmd_s[0] == "exit"){
                logdbg("Exiting...");
                return;
            }
			else if (cmd_s[0] == "reload"){
			location.reload();
			break;
			}
			else if (cmd_s[0] == "autodump"){
				logdbg("Directive one: Protect humanity! Directive two: Dump ram at all costs. Directive three: Dance!");
				addr = do_search(aspace, 0x82000000, 0xFFFFFFFF, "Sce");
				var webkit_module_info = new module_info(addr-4,aspace);
				var webkit_module = new sce_module(webkit_module_info,aspace);
				
				//working 
				base = webkit_module.baseaddr;
				logdbg(base);
				stub_end = webkit_module_info.stub_end;
				do_read(aspace,base,0x5C);
				do_dump(aspace,base,stub_end,"webkit.bin");
				
				
				
				for(i=0;i<webkit_module.import_list.length;i++)
				{
				
				}
				
				
				continue;
			}
			else if (cmd_s[0] == "atdis"){
				
				addr = do_search(aspace, 0x82000000, 0xFFFFFFFF, "Sce");
				var webkit_module_info = new module_info(addr-4,aspace);
				var webkit_module = new sce_module(webkit_module_info,aspace);
			
			}
            // examine
            else if(cmd_s[0] == "x"){
                if(cmd_s.length < 2){
                    logdbg("x <addr> <len>");
                    continue;
                }
                var addr = Number(cmd_s[1]);
                var len = Number(cmd_s[2]);
                do_read(aspace, addr, len); 
            }
            else if(cmd_s[0] == "dis"){
                if(cmd_s.length < 3){
                    logdbg("dis <addr> <len> <mode>");
                    continue;
                }
                if(cmd_s.length == 4){
                    var mode = cmd_s[3];
                }else{
                    var mode = "arm";
                }
                var addr = Number(cmd_s[1]);
                var len = Number(cmd_s[2]);
                do_dis(aspace, addr, len, mode); 
            }
            else if(cmd_s[0] == "dump"){
                if(cmd_s.length < 3){
                    logdbg("dump <addr> <len> <outfile>");
                    continue;
                }

                var addr = Number(cmd_s[1]);
                var len = Number(cmd_s[2]);
                var fname = cmd_s[3];
                do_dump(aspace, addr, len, fname);
            }
            // search string
            else if(cmd_s[0] == 'ss'){
                if(cmd_s.length < 3){
                    logdbg("ss <beginaddr> <endaddr> <pattern>");
                    continue;
                }
                var begaddr = Number(cmd_s[1]);
                var endaddr = Number(cmd_s[2]);
                var pattern = cmd_s[3];
                do_search(aspace, begaddr, endaddr, pattern);
            }
            // reload page
            else if(cmd_s[0] == "reload"){
                logdbg("Reloading...");
                document.location.href='/index.html';
                return;
            }
            else{
                logdbg("Unknown command: " + cmd_s[0]);
            }
        }
    }catch(e){
        sendmsg("ShellError: " + e);
    }
}