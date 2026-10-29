// PT4 — interações. Sem dependências; tudo é melhoria progressiva sobre o HTML.
(() => {
  window.pt4 = true; // sinal para o <head>: o JS carregou

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const topo = $('#topo');

  // Cabeçalho: ganha fundo depois de sair do topo da página
  const sentinela = document.createElement('div');
  sentinela.style.cssText = 'position:absolute;top:0;height:8px;width:1px';
  document.body.prepend(sentinela);
  new IntersectionObserver(([e]) => topo.classList.toggle('rolado', !e.isIntersecting)).observe(sentinela);

  // Menu móvel
  const btn = $('.menu-btn');
  const menu = $('#menu');
  const abrir = (sim) => {
    btn.setAttribute('aria-expanded', sim);
    topo.classList.toggle('aberto', sim);
    if (sim) $('a', menu).focus();
  };
  btn.addEventListener('click', () => abrir(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) abrir(false); });
  document.addEventListener('click', (e) => {
    if (btn.getAttribute('aria-expanded') === 'true' && !topo.contains(e.target)) abrir(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { abrir(false); btn.focus(); }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches) abrir(false); });

  // Revelação ao entrar no ecrã — uma vez só, depois deixa de observar
  const revelar = new IntersectionObserver((entradas, obs) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visivel');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  $$('.revela').forEach((el) => revelar.observe(el));

  // Link ativo no menu conforme a secção visível
  const links = new Map($$('.menu a:not(.btn)').map((a) => [a.hash, a]));
  const ativo = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      const a = links.get('#' + e.target.id);
      if (!a) continue;
      if (e.isIntersecting) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => ativo.observe(s));

  // Diagrama do hero: pausa as animações contínuas quando sai do ecrã
  const hero = $('.hero');
  new IntersectionObserver(([e]) => hero.classList.toggle('fora', !e.isIntersecting)).observe(hero);

  // Brilho dos cartões segue o cursor (só com rato)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.cartao').forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));
  }

  // Formulário: valida e prepara o email na aplicação do visitante.
  // Não há servidor: nada é enviado sem o visitante carregar em "enviar" no seu email.
  const form = $('#form-contacto');
  const estado = $('#form-estado');
  const mensagens = {
    nome: 'Indique o seu nome.',
    email: { valueMissing: 'Indique o seu email.', typeMismatch: 'Este email não parece válido.' },
    mensagem: { valueMissing: 'Escreva a sua mensagem.', tooShort: 'A mensagem é demasiado curta.' },
  };
  const erroDe = (campo) => {
    const v = campo.validity;
    const m = mensagens[campo.name];
    // o browser só aplica minlength ao que é escrito à mão; colado/autopreenchido passa
    if (v.valid && campo.minLength > 0 && campo.value.trim().length < campo.minLength) return m.tooShort;
    if (v.valid) return '';
    if (typeof m === 'string') return m;
    return m[Object.keys(m).find((k) => v[k])] || 'Verifique este campo.';
  };
  const validar = (campo) => {
    const msg = erroDe(campo);
    const alvo = document.getElementById(campo.id + '-erro');
    if (alvo) alvo.textContent = msg;
    if (msg) campo.setAttribute('aria-invalid', 'true'); else campo.removeAttribute('aria-invalid');
    return !msg;
  };
  const obrigatorios = $$('[required]', form);
  obrigatorios.forEach((c) => c.addEventListener('blur', () => { if (c.value) validar(c); }));
  obrigatorios.forEach((c) => c.addEventListener('input', () => { if (c.hasAttribute('aria-invalid')) validar(c); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalidos = obrigatorios.filter((c) => !validar(c));
    if (invalidos.length) {
      invalidos[0].focus();
      estado.textContent = 'Corrija os campos assinalados.';
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const assunto = `Pedido de contacto — ${d.empresa || d.nome}`;
    const dados = [`Nome: ${d.nome}`, `Email: ${d.email}`];
    if (d.telefone) dados.push(`Telefone: ${d.telefone}`);
    if (d.empresa) dados.push(`Empresa: ${d.empresa}`);
    const corpo = `${d.mensagem}\n\n${dados.join('\n')}`;
    const botao = $('button[type=submit]', form);
    botao.setAttribute('aria-busy', 'true');
    location.href = `mailto:suporte@pt4.pt?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    estado.textContent = 'A abrir a sua aplicação de email. Se nada acontecer, escreva-nos para suporte@pt4.pt.';
    setTimeout(() => botao.removeAttribute('aria-busy'), 1500);
  });
})();
