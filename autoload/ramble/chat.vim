function! ramble#chat#open(buf, provider, question) abort
  call denops#request("ramble", "open", [bufnr(a:buf), a:provider])
  call denops#request("ramble", "append", [bufnr(a:buf), a:question])

  if a:question != ""
    call ramble#chat#chat(bufnr(a:buf))
  endif
endfunction

function! ramble#chat#chat(buf) abort
  call denops#request_async(
  \ "ramble", "chat", [bufnr(a:buf)],
  \ {v -> denops#request("ramble", "append", [bufnr(a:buf), ""]) && redraw},
  \ {e -> denops#request("ramble", "append", [bufnr(a:buf), ""]) && redraw},
  \)
endfunction
