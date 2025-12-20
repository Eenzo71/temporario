// --- VARIÁVEIS DE ESTADO ---
let filaReproducao = []; 
let indiceAtual = 0;
let tocando = false;
let modoRepeticao = 0; // 0=Off, 1=All, 2=One
let modoAleatorio = false;
let searchTimer = null; 

// --- CONFIGURAÇÃO DE ÁUDIO ---
const audio = new Audio();
audio.crossOrigin = "anonymous"; // Essencial para o visualizer funcionar

const colorThief = new ColorThief();

// =================================================================
// 1. CARREGAMENTO E UPLOAD
// =================================================================

async function carregarPlaylist() {
    console.log("Buscando músicas no Supabase...");
    const { data, error } = await window.supabase.storage.from('musicas').list();

    if (error) {
        console.error("Erro ao buscar músicas:", error);
        return;
    }

    const musicasDoBucket = data
        .filter(arq => arq.name.toLowerCase().endsWith('.mp3') || arq.name.toLowerCase().endsWith('.m4a'))
        .map(arq => {
            const { data: { publicUrl } } = window.supabase.storage.from('musicas').getPublicUrl(arq.name);
            let nomeLimpo = arq.name.replace(/^\d+_/, "").replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            
            return {
                titulo: nomeLimpo,
                artista: "Nossa Playlist",
                url: publicUrl,
                capa: "imgs/cd.png", 
                id_supabase: arq.name,
                origem: 'bucket'
            };
        });

    if (musicasDoBucket.length > 0) {
        filaReproducao = musicasDoBucket;
        atualizarFilaVisual();
        carregarMusica(0, false); 
    }
}

async function fazerUploadMusica() {
    const input = document.getElementById('music-upload');
    const arquivo = input.files[0];
    if (!arquivo) return;

    const btn = document.querySelector('.btn-upload-music');
    const textoOriginal = btn.innerText;
    btn.innerText = "Enviando... ⏳";
    btn.disabled = true;

    try {
        const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const nomeArquivo = `${Date.now()}_${nomeLimpo}`;

        const { error } = await window.supabase.storage.from('musicas').upload(nomeArquivo, arquivo);
        if (error) throw error;

        alert("Música adicionada com sucesso! 🎵");
        await carregarPlaylist();

    } catch (erro) {
        console.error(erro);
        alert("Erro no upload: " + erro.message);
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
        input.value = "";
    }
}

function buscarMusicaOnline(termo) {
    clearTimeout(searchTimer);
    const listaResults = document.getElementById('itunes-list');
    const divResults = document.getElementById('search-results-list');
    const loading = document.getElementById('search-loading');
    
    if (!termo || termo.length < 3) {
        divResults.style.display = 'none';
        return;
    }

    searchTimer = setTimeout(async () => {
        loading.style.display = 'block';
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&media=music&limit=5`);
            const data = await res.json();
            
            listaResults.innerHTML = '';
            
            if (data.results.length > 0) {
                divResults.style.display = 'block';
                data.results.forEach(track => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <img src="${track.artworkUrl60}">
                        <div style="flex:1;">
                            <div style="font-weight:bold; font-size:0.8rem; color:white;">${track.trackName}</div>
                            <div style="font-size:0.7rem; color:#aaa;">${track.artistName}</div>
                        </div>
                        <div style="font-size:0.7rem; color:#d81b60; font-weight:bold;">+ Add</div>
                    `;
                    li.onclick = () => adicionarNaFila(track);
                    listaResults.appendChild(li);
                });
            }
        } catch (e) {
            console.error("Erro iTunes:", e);
        } finally {
            loading.style.display = 'none';
        }
    }, 600);
}

function adicionarNaFila(track) {
    const novaMusica = {
        titulo: track.trackName,
        artista: track.artistName,
        url: track.previewUrl, 
        capa: track.artworkUrl100.replace('100x100', '600x600'),
        id_supabase: null,
        origem: 'itunes'
    };
    
    filaReproducao.push(novaMusica);
    atualizarFilaVisual();
    
    if (confirm(`"${track.trackName}" adicionada! Tocar agora?`)) {
        carregarMusica(filaReproducao.length - 1);
    }
    
    document.getElementById('itunes-search').value = '';
    document.getElementById('search-results-list').style.display = 'none';
}


// =================================================================
// 2. CORE PLAYER
// =================================================================

async function carregarMusica(index, autoPlay = true) {
    if (filaReproducao.length === 0) return;
    
    if (index < 0) index = filaReproducao.length - 1;
    if (index >= filaReproducao.length) index = 0;
    
    indiceAtual = index;
    const musica = filaReproducao[indiceAtual];
    
    audio.src = musica.url;
    
    audio.onerror = function() {
        console.error("Erro ao carregar áudio:", audio.error);
        alert("Não foi possível tocar essa música (Erro no link).");
    };

    // --- ATUALIZAÇÃO VISUAL (Mini e Full) ---
    // Atualiza Full Player
    document.getElementById('full-title').innerText = musica.titulo;
    document.getElementById('full-artist').innerText = musica.artista;
    
    // Atualiza Mini Player (CORREÇÃO DE TITULO)
    const miniTitle = document.getElementById('mini-title');
    const miniArtist = document.getElementById('mini-artist');
    if(miniTitle) miniTitle.innerText = musica.titulo;
    if(miniArtist) miniArtist.innerText = musica.artista;

    buscarExtras(musica);

    if (autoPlay) {
        try {
            await audio.play();
            tocando = true;
            atualizarIconesPlay(true);
        } catch (e) {
            console.log("Autoplay bloqueado:", e);
            tocando = false;
            atualizarIconesPlay(false);
        }
    } else {
        atualizarIconesPlay(false);
    }

    // Marca na fila
    document.querySelectorAll('#queue-list li').forEach(li => li.classList.remove('playing'));
    const itemFila = document.getElementById(`queue-item-${index}`);
    if(itemFila) itemFila.classList.add('playing');
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        tocando = true;
    } else {
        audio.pause();
        tocando = false;
    }
    atualizarIconesPlay(tocando);
}

// --- CORREÇÃO DA ANIMAÇÃO E ÍCONES ---
function atualizarIconesPlay(isPlaying) {
    // Ícones do Mini Player
    const miniPlay = document.getElementById('mini-icon-play');
    const miniPause = document.getElementById('mini-icon-pause');
    
    // Ícones do Full Player
    const fullPlay = document.getElementById('full-icon-play');
    const fullPause = document.getElementById('full-icon-pause');

    // Container do Mini Player (para animação de giro)
    const miniPlayerContainer = document.getElementById('mini-player');

    if (isPlaying) {
        // Trocando ícones
        if(miniPlay) miniPlay.style.display = 'none';
        if(miniPause) miniPause.style.display = 'block';
        if(fullPlay) fullPlay.style.display = 'none';
        if(fullPause) fullPause.style.display = 'block';
        
        // Ativando animação de giro
        if(miniPlayerContainer) miniPlayerContainer.classList.add('playing');
        
    } else {
        // Trocando ícones
        if(miniPlay) miniPlay.style.display = 'block';
        if(miniPause) miniPause.style.display = 'none';
        if(fullPlay) fullPlay.style.display = 'block';
        if(fullPause) fullPause.style.display = 'none';
        
        // Parando animação
        if(miniPlayerContainer) miniPlayerContainer.classList.remove('playing');
    }
}

// Volume Sincronizado
const volSliderMini = document.getElementById('volume-slider');
const volSliderFull = document.getElementById('volume-slider-full');

function setVolume(val) {
    audio.volume = val;
    if(volSliderMini) volSliderMini.value = val;
    if(volSliderFull) volSliderFull.value = val;
}

if(volSliderMini) volSliderMini.addEventListener('input', (e) => setVolume(e.target.value));
if(volSliderFull) volSliderFull.addEventListener('input', (e) => setVolume(e.target.value));

// Shuffle e Repeat
function toggleShuffle() {
    modoAleatorio = !modoAleatorio;
    const btn = document.getElementById('btn-shuffle');
    if(modoAleatorio) btn.classList.add('active');
    else btn.classList.remove('active');
}

function toggleRepeat() {
    modoRepeticao++;
    if (modoRepeticao > 2) modoRepeticao = 0;
    
    const btn = document.getElementById('btn-repeat');
    const indicator = btn.querySelector('.dot-indicator');
    
    btn.classList.remove('active');
    if(indicator) indicator.style.display = 'none';

    if (modoRepeticao === 1) btn.classList.add('active'); // Repetir Tudo
    if (modoRepeticao === 2) {
        btn.classList.add('active'); // Repetir Uma
        if(indicator) indicator.style.display = 'block'; 
    }
}

// Navegação
function antSong() {
    if (audio.currentTime > 10) {
        audio.currentTime = 0; 
    } else {
        if (modoAleatorio) {
            let novoIndex = Math.floor(Math.random() * filaReproducao.length);
            carregarMusica(novoIndex);
        } else {
            carregarMusica(indiceAtual - 1);
        }
    }
}

function proxSong() {
    if (modoRepeticao === 2) { 
        audio.currentTime = 0;
        audio.play();
        return;
    }
    if (modoAleatorio) {
        let novoIndex = Math.floor(Math.random() * filaReproducao.length);
        carregarMusica(novoIndex);
    } else {
        carregarMusica(indiceAtual + 1);
    }
}

audio.addEventListener('ended', proxSong);

// Barra de Progresso
audio.addEventListener('timeupdate', () => {
    if(!audio.duration) return;
    const porcentagem = (audio.currentTime / audio.duration) * 100;
    
    const miniBar = document.getElementById('mini-progress');
    if(miniBar) miniBar.style.width = `${porcentagem}%`; // Correção: width em vez de background
    
    const fullProg = document.getElementById('full-progress');
    if(fullProg) fullProg.style.width = `${porcentagem}%`;
    
    document.getElementById('curr-time').innerText = formatarTempo(audio.currentTime);
    document.getElementById('total-dur').innerText = formatarTempo(audio.duration || 0);
});

document.getElementById('full-progress-container').addEventListener('click', (e) => {
    const width = e.target.clientWidth;
    const clickX = e.offsetX;
    audio.currentTime = (clickX / width) * audio.duration;
});


// =================================================================
// 3. EXTRAS, CORES E VISUALIZER
// =================================================================

async function buscarExtras(musica) {
    const imgCapa = document.getElementById('full-cover');
    const miniCapa = document.getElementById('mini-cover');
    
    imgCapa.src = musica.capa;
    miniCapa.src = musica.capa;
    
    imgCapa.onload = function() {
        try {
            const corDominante = colorThief.getColor(imgCapa);
            const rgb = `rgb(${corDominante[0]}, ${corDominante[1]}, ${corDominante[2]})`;
            document.getElementById('mini-player').style.boxShadow = `0 -5px 20px ${rgb}`;
            document.getElementById('dynamic-bg').style.background = `linear-gradient(180deg, ${rgb} 0%, #121212 90%)`;
        } catch (e) { console.log("CORS ColorThief aviso."); }
    };

    // Limpa dados antigos
    const lyricsBox = document.getElementById('lyrics-content');
    const dedicatoriaBox = document.getElementById('area-dedicatoria');
    lyricsBox.innerText = "Buscando letra...";
    dedicatoriaBox.style.display = 'none';

    if(!musica.id_supabase) {
        lyricsBox.innerText = "Letra indisponível para prévias.";
        return;
    }

    const { data } = await window.supabase
        .from('musica_extras')
        .select('*')
        .eq('nome_arquivo', musica.id_supabase)
        .single();

    if (data) {
        if (data.letra) lyricsBox.innerText = data.letra;
        else tentarBuscarLetraAPI(musica.titulo, musica.artista);
        
        if (data.dedicatoria) {
            dedicatoriaBox.style.display = 'block';
            document.getElementById('texto-dedicatoria').innerText = `"${data.dedicatoria}"`;
            document.getElementById('autor-dedicatoria').innerText = `- ${data.autor_dedicatoria}`;
        }
    } else {
        tentarBuscarLetraAPI(musica.titulo, musica.artista);
    }
}

async function tentarBuscarLetraAPI(titulo, artista) {
    const lyricsDiv = document.getElementById('lyrics-content');
    try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${artista}/${titulo}`);
        const data = await res.json();
        if (data.lyrics) lyricsDiv.innerText = data.lyrics;
        else lyricsDiv.innerText = "Letra não encontrada.\nEscreva manualmente e salve! ❤️";
    } catch (e) {
        lyricsDiv.innerText = "Clique para escrever a letra...";
    }
}

async function salvarLetra() {
    const letra = document.getElementById('lyrics-content').innerText;
    const musica = filaReproducao[indiceAtual];
    if(!musica.id_supabase) return alert("Não é possível salvar letra para músicas online.");

    const { data: existente } = await window.supabase.from('musica_extras').select('id').eq('nome_arquivo', musica.id_supabase).single();

    if (existente) {
        await window.supabase.from('musica_extras').update({ letra: letra }).eq('id', existente.id);
    } else {
        await window.supabase.from('musica_extras').insert([{ nome_arquivo: musica.id_supabase, letra: letra }]);
    }
    alert("Letra salva! 💾");
}

async function salvarDedicatoria() {
    const texto = document.getElementById('input-dedicatoria').value;
    const musica = filaReproducao[indiceAtual];

    if(!musica.id_supabase) return alert("Apenas músicas enviadas por você podem ter dedicatória!");
    if(!texto) return alert("Escreva algo primeiro! ❤️");

    const { data: { user } } = await window.supabase.auth.getUser();
    const autor = user.email.includes('enzo') ? 'Enzo' : 'Brenda'; 

    const { data: existente } = await window.supabase.from('musica_extras').select('id').eq('nome_arquivo', musica.id_supabase).single();

    if (existente) {
        await window.supabase.from('musica_extras').update({ dedicatoria: texto, autor_dedicatoria: autor }).eq('id', existente.id);
    } else {
        await window.supabase.from('musica_extras').insert([{ nome_arquivo: musica.id_supabase, dedicatoria: texto, autor_dedicatoria: autor }]);
    }

    alert("Dedicatória salva! ❤️");
    document.getElementById('area-dedicatoria').style.display = 'block';
    document.getElementById('texto-dedicatoria').innerText = `"${texto}"`;
    document.getElementById('autor-dedicatoria').innerText = `- ${autor}`;
    document.getElementById('input-dedicatoria').value = "";
}

// --- VISUALIZER (CORRIGIDO PARA BAIXO) ---
let audioContext, analyser, source;

function iniciarVisualizer() {
    if(!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        try {
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            // MUDANÇA 1: Aumentamos a resolução (era 64, agora 256 ou 512)
            // Isso deixa as barras mais finas e o movimento mais fluido
            analyser.fftSize = 256; 
        } catch(e) { return; }
    }
    
    const canvasMini = document.getElementById('mini-visualizer');
    const canvasFull = document.getElementById('full-visualizer'); 
    
    let ctxFull = null;
    if(canvasFull) {
        canvasFull.width = canvasFull.offsetWidth;
        canvasFull.height = canvasFull.offsetHeight;
        ctxFull = canvasFull.getContext('2d');
    }

    const ctxMini = canvasMini ? canvasMini.getContext('2d') : null;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        // 1. Mini Player (Visual Clean Branco)
        if(ctxMini) {
            ctxMini.clearRect(0, 0, canvasMini.width, canvasMini.height);
            // Calcula largura dinâmica baseada na quantidade de barras
            const barWidth = (canvasMini.width / bufferLength); 
            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                let barHeight = dataArray[i] / 2;
                ctxMini.fillStyle = `rgba(255, 255, 255, 0.4)`;
                // fillRect(x, y, largura, altura)
                ctxMini.fillRect(x, canvasMini.height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        }

        // 2. Full Player (Visual "Suave e Belo")
        if(ctxFull && document.getElementById('full-player').classList.contains('active')) {
            ctxFull.clearRect(0, 0, canvasFull.width, canvasFull.height);
            
            const barWidth = (canvasFull.width / bufferLength) * 1.5; 
            let x = 0;
            
            for(let i = 0; i < bufferLength; i++) {
                // Escala a altura para não ficar agressivo demais
                // (dataArray[i] / 255) dá uma porcentagem de 0 a 1
                let barHeight = (dataArray[i] / 255) * canvasFull.height * 0.8; 
                
                // MUDANÇA 2: Gradiente Bonito
                // Cria um degradê que vai do chão (rosa forte) até o topo da barra (rosa claro/transparente)
                let gradient = ctxFull.createLinearGradient(0, canvasFull.height, 0, canvasFull.height - barHeight);
                gradient.addColorStop(0, '#d81b60');       // Base Rosa Choque
                gradient.addColorStop(1, 'rgba(255, 64, 129, 0.3)'); // Topo suave

                ctxFull.fillStyle = gradient;
                
                // Desenha a barra com cantos levemente arredondados (opcional, simula suavidade)
                // Se o navegador suportar roundRect, fica lindo. Se não, usa fillRect normal.
                if (ctxFull.roundRect) {
                    ctxFull.beginPath();
                    ctxFull.roundRect(x, canvasFull.height - barHeight, barWidth - 2, barHeight, [5, 5, 0, 0]);
                    ctxFull.fill();
                } else {
                    ctxFull.fillRect(x, canvasFull.height - barHeight, barWidth - 2, barHeight);
                }
                
                x += barWidth; 
            }
        }
    }
    draw();
}

audio.addEventListener('play', () => { if(!audioContext) iniciarVisualizer(); });

// --- UI UTILS ---
function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function abrirPlayerFull() { document.getElementById('full-player').classList.add('active'); }
function fecharPlayerFull() { document.getElementById('full-player').classList.remove('active'); }

function toggleSearch() {
    toggleFila();
    document.getElementById('itunes-search').focus(); 
}
function toggleFila() { 
    document.getElementById('queue-panel').classList.toggle('open');
    document.getElementById('lyrics-panel').classList.remove('open');
}
function toggleLyrics() { 
    document.getElementById('lyrics-panel').classList.toggle('open');
    document.getElementById('queue-panel').classList.remove('open');
}

// Fechar clicar fora
document.addEventListener('click', (e) => {
    const queuePanel = document.getElementById('queue-panel');
    const lyricsPanel = document.getElementById('lyrics-panel');
    const btnFila = document.getElementById('btn-fila');
    const btnLyrics = document.getElementById('btn-lyrics');

    if (queuePanel.classList.contains('open') && !queuePanel.contains(e.target) && !btnFila.contains(e.target)) {
        toggleFila();
    }
    if (lyricsPanel.classList.contains('open') && !lyricsPanel.contains(e.target) && !btnLyrics.contains(e.target)) {
        toggleLyrics();
    }
});

document.addEventListener('click', (e) => {
    const queuePanel = document.getElementById('queue-panel');
    const lyricsPanel = document.getElementById('lyrics-panel');
    
    // Botões
    const btnFila = document.getElementById('btn-fila');
    const btnLyrics = document.getElementById('btn-lyrics');
    const btnSearch = document.getElementById('btn-search'); // O botão da Lupa!

    // 1. Lógica da FILA (Protege o clique no botão Fila E no botão Search)
    // Se o clique NÃO foi dentro do painel... E NÃO foi no botão fila... E NÃO foi na lupa... ENTÃO fecha.
    if (queuePanel.classList.contains('open') && 
        !queuePanel.contains(e.target) && 
        !btnFila.contains(e.target) &&
        (!btnSearch || !btnSearch.contains(e.target))) { 
        
        toggleFila();
    }

    // 2. Lógica da LETRA
    if (lyricsPanel.classList.contains('open') && 
        !lyricsPanel.contains(e.target) && 
        !btnLyrics.contains(e.target)) {
        
        toggleLyrics();
    }
});