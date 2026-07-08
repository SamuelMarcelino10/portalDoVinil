<?php
/**
 * Storage: sobe arquivos pro Supabase Storage (bucket "produtos") e
 * devolve a URL publica da imagem. Usa a chave-mestra (service_role),
 * que fica so aqui no backend.
 */
class Storage
{
    private const BUCKET = 'produtos';

    // Sobe um arquivo e devolve a URL publica, ou null se algo falhar.
    public static function upload(string $caminhoTmp, string $mime, string $extensao): ?string
    {
        $url = rtrim((string) getenv('SUPABASE_URL'), '/');
        $key = (string) getenv('SUPABASE_SERVICE_KEY');
        if ($url === '' || $key === '') {
            return null;
        }

        // Nome unico pra nao sobrescrever fotos de outros produtos
        $nome = 'capa-' . bin2hex(random_bytes(8));
        if ($extensao !== '') {
            $nome .= '.' . $extensao;
        }

        $conteudo = file_get_contents($caminhoTmp);
        if ($conteudo === false) {
            return null;
        }

        $ch = curl_init("$url/storage/v1/object/" . self::BUCKET . "/$nome");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => 'POST',
            CURLOPT_POSTFIELDS     => $conteudo,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Content-Type: $mime",
                "apikey: $key",
                "Authorization: Bearer $key",
            ],
        ]);
        curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status < 200 || $status >= 300) {
            return null;
        }

        // URL publica do arquivo recem-enviado
        return "$url/storage/v1/object/public/" . self::BUCKET . "/$nome";
    }

    // Apaga do Storage a foto correspondente a uma URL publica nossa.
    public static function delete(string $urlPublica): void
    {
        $url = rtrim((string) getenv('SUPABASE_URL'), '/');
        $key = (string) getenv('SUPABASE_SERVICE_KEY');
        if ($url === '' || $key === '') {
            return;
        }

        // So mexe se a URL for mesmo do nosso bucket
        $marcador = '/object/public/' . self::BUCKET . '/';
        $pos = strpos($urlPublica, $marcador);
        if ($pos === false) {
            return;
        }
        $arquivo = substr($urlPublica, $pos + strlen($marcador));
        if ($arquivo === '') {
            return;
        }

        $ch = curl_init("$url/storage/v1/object/" . self::BUCKET . "/$arquivo");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => 'DELETE',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "apikey: $key",
                "Authorization: Bearer $key",
            ],
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}
