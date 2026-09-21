namespace IGB.Smartphones.Api.Utils;

// Validação estrutural do CPF (algoritmo público dos dígitos verificadores),
// usada apenas para rejeitar valores claramente inválidos. Não representa regra de negócio.
public static class CpfValidator
{
    public static bool EhValido(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf) || cpf.Length != 11 || !cpf.All(char.IsDigit))
            return false;

        if (cpf.Distinct().Count() == 1)
            return false;

        var digitos = cpf.Select(c => c - '0').ToArray();

        int CalcularDigitoVerificador(int quantidade)
        {
            var soma = 0;
            var multiplicador = quantidade + 1;
            for (var i = 0; i < quantidade; i++)
                soma += digitos[i] * multiplicador--;

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }

        return CalcularDigitoVerificador(9) == digitos[9] && CalcularDigitoVerificador(10) == digitos[10];
    }
}
