augroup ramble-chat-setting
  autocmd!

  autocmd BufNewFile,BufRead *.ramble.md set filetype=ramble-chat
  autocmd FileType ramble-chat nnoremap <silent> <buffer> <C-Space> :<C-u>call denops#request("ramble", "chat", [bufnr()])<CR>
augroup END
