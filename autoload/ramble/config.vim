function! ramble#config#get() abort
  return denops#request("ramble", "config", [])
endfunction

function! ramble#config#open() abort
  execute "edit " . ramble#config#get()
endfunction
