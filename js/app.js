import { Item } from './item.js';
import { ItemService } from './itemService.js';

const svc = new ItemService();
const grid = document.getElementById('grid');
const vazio = document.getElementById('vazio');
const alertHost = document.getElementById('alertHost');
const filtroCategoria = document.getElementById('filtroCategoria');
const buscaInput = document.getElementById('buscaInput');

function showAlert(type, msg, timeout=2000){
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  alertHost.appendChild(el);
  if (timeout){
    setTimeout(() => { el.classList.remove('show'); el.addEventListener('transitionend', () => el.remove()); }, timeout);
  }
}

function cardTemplate(item){
  const img = item.imagem || 'https://picsum.photos/seed/placeholder/800/600';
  return `<div class="col">
    <div class="card h-100 shadow-sm">
      <img src="${img}" class="card-img-top" alt="${item.titulo}">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start">
          <h5 class="card-title mb-1">${item.titulo}</h5>
          <span class="badge badge-cat">${item.categoria || '—'}</span>
        </div>
        <p class="text-muted small mb-1">${item.pais || '—'} ${item.ano ? '• ' + item.ano : ''}</p>
        <p class="card-text small flex-grow-1">${item.descricao || ''}</p>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-sm btn-outline-secondary" data-edit="${item.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-del="${item.id}">Excluir</button>
        </div>
      </div>
    </div>
  </div>`;
}

let cache = [];
async function load(){
  const items = await svc.fetchItems();
  cache = items;
  render();
}

function render(){
  let items = [...cache];
  const cat = filtroCategoria.value;
  const q = (buscaInput.value || '').toLowerCase().trim();
  if (cat) items = items.filter(i => i.categoria === cat);
  if (q) items = items.filter(i => (i.titulo||'').toLowerCase().includes(q) || (i.pais||'').toLowerCase().includes(q));
  if (!items.length){
    grid.innerHTML = '';
    vazio.classList.remove('d-none');
  } else {
    vazio.classList.add('d-none');
    grid.innerHTML = items.map(cardTemplate).join('');
  }
}

document.getElementById('btnRecarregar').addEventListener('click', load);
document.getElementById('btnSeed').addEventListener('click', async () => {
  const seeded = await svc.seedIfEmpty();
  if (seeded) showAlert('success', 'Exemplos adicionados.');
  else showAlert('info', 'Já existem itens cadastrados.');
  await load();
});

filtroCategoria.addEventListener('change', render);
buscaInput.addEventListener('input', render);

grid.addEventListener('click', async (e) => {
  const del = e.target.getAttribute('data-del');
  const edit = e.target.getAttribute('data-edit');
  if (del){
    if (confirm('Remover este item?')){
      await svc.removeItem(del);
      showAlert('success', 'Item removido.');
      await load();
    }
  }
  if (edit){
    const it = cache.find(x => x.id === edit);
    fillForm(it);
    window.scrollTo({ top: document.getElementById('novo').offsetTop - 80, behavior: 'smooth' });
  }
});

const form = document.getElementById('formItem');
const btnCancelar = document.getElementById('btnCancelarEdicao');

function formToObject(form){
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}
function resetForm(){ form.reset(); document.getElementById('id').value = ''; }

function fillForm(i){
  document.getElementById('id').value = i.id || '';
  document.getElementById('titulo').value = i.titulo || '';
  document.getElementById('categoria').value = i.categoria || '';
  document.getElementById('imagem').value = i.imagem || '';
  document.getElementById('pais').value = i.pais || '';
  document.getElementById('ano').value = i.ano || '';
  document.getElementById('descricao').value = i.descricao || '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const obj = formToObject(form);
  const payload = { titulo: obj.titulo, descricao: obj.descricao, categoria: obj.categoria, imagem: obj.imagem, pais: obj.pais, ano: obj.ano ? Number(obj.ano) : null };
  const id = obj.id;
  if (id){
    await svc.updateItem(id, payload);
    showAlert('success', 'Item atualizado.');
  } else {
    await svc.addItem(payload);
    showAlert('success', 'Item adicionado.');
  }
  resetForm();
  await load();
});
btnCancelar.addEventListener('click', resetForm);

(async function init(){
  try{
    await load();
    if (!cache.length){
      document.getElementById('btnSeed').classList.add('btn-primary');
    }
  } catch(e){
    console.error(e);
    showAlert('danger', 'Falha ao carregar dados.');
  }
})();