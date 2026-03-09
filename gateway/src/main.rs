use actix_web::{post, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct HookPayload {
    hook_type: String,
    content: String,
}

#[derive(Serialize)]
struct GatewayResponse {
    status: String,
    message: String,
}

#[post("/api/hooks/inject")]
async fn inject_hook(payload: web::Json<HookPayload>) -> impl Responder {
    // Zero-latency interception logic will be built here.
    // E.g., validating the hook, extracting variables, and sending to WASM FTS5 module.
    println!("Received fast-path hook: {}", payload.hook_type);
    
    HttpResponse::Ok().json(GatewayResponse {
        status: "success".to_string(),
        message: format!("Hook {} received at zero-latency gateway", payload.hook_type),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port = 37777;
    println!("🚀 Rust Memory Gateway starting on port {}...", port);
    
    HttpServer::new(|| {
        App::new()
            .service(inject_hook)
    })
    .bind(("127.0.0.1", port))?
    .run()
    .await
}
