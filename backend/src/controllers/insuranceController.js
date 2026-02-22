class InsuranceController {
  calculatePremium(req, res) {
    const { valorCasco, valorExtras, anio, ciudad } = req.body;
    const currentYear = 2026;

    // 1. Validar que el carro no sea más viejo de 10 años
    if (currentYear - anio > 10) {
      return res.status(400).json({ 
        success: false, 
        error: "Vehículo demasiado antiguo. Límite: año 2016." 
      });
    }

    // 2. Calcular Valor Asegurado (Suma de casco y extras)
    const valorAsegurado = parseFloat(valorCasco) + parseFloat(valorExtras);

    // 3. Elegir la tasa según tu tabla de Excel
    let tasa = 0;
    if (valorAsegurado <= 18000) tasa = 0.042;
    else if (valorAsegurado <= 30000) tasa = 0.039;
    else if (valorAsegurado <= 40000) tasa = 0.032;
    else tasa = 0.029;

    // 4. Cálculos de dinero (Prima Neta e Impuestos)
    const primaNeta = valorAsegurado * tasa;
    const superBancos = primaNeta * 0.035; // 3.5%
    const seguroCampesino = primaNeta * 0.005; // 0.5%
    const derechoEmision = primaNeta * 0.005; // 0.5% según tu pedido
    
    const subtotal = primaNeta + superBancos + seguroCampesino + derechoEmision;
    const iva = subtotal * 0.15; // IVA 15%
    const primaTotal = subtotal + iva;

    // 5. Enviar respuesta a la App
    res.json({
      success: true,
      data: {
        detalle: {
          valorAsegurado: valorAsegurado.toFixed(2),
          tasaAplicada: (tasa * 100).toFixed(2) + "%",
          primaNeta: primaNeta.toFixed(2),
          superBancos: superBancos.toFixed(2),
          seguroCampesino: seguroCampesino.toFixed(2),
          derechoEmision: derechoEmision.toFixed(2),
          subtotal: subtotal.toFixed(2),
          iva: iva.toFixed(2),
          total: primaTotal.toFixed(2)
        }
      }
    });
  }
}

module.exports = new InsuranceController();