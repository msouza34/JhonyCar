# Newman runner (JhonyCar)

## 1) Instalar dependencia (uma vez)

```powershell
npm install -g newman
```

## 2) Executar fluxo completo

```powershell
powershell -ExecutionPolicy Bypass -File .\postman\run-newman.ps1
```

Se `JhonyCar-Local.postman_environment.json` nao existir, o script cria automaticamente a copia a partir de `JhonyCar-Local.postman_environment.example.json`.

## 3) Executar com baseUrl customizada

```powershell
powershell -ExecutionPolicy Bypass -File .\postman\run-newman.ps1 -BaseUrl "http://localhost:8080"
```

## 4) Ignorar SSL (ambiente com certificado self-signed)

```powershell
powershell -ExecutionPolicy Bypass -File .\postman\run-newman.ps1 -Insecure
```

## Saidas geradas

Em `postman/reports/`:

- `newman.<timestamp>.junit.xml`
- `newman.<timestamp>.report.json`
- `JhonyCar-Local.final.<timestamp>.json`

## Observacao de autenticacao

A colecao autentica com `admin` para executar o fluxo principal e armazena o token de `funcionario` separadamente (`token_funcionario`), sem sobrescrever o token principal.
