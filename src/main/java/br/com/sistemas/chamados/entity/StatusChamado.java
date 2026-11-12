package br.com.sistemas.chamados.entity;

public enum StatusChamado {
    ABERTO,
    EM_ATENDIMENTO,
    AGUARDANDO_CLIENTE,
    FECHADO;

    public boolean podeTransitarPara(StatusChamado destino) {
        return switch (this) {
            case ABERTO -> destino == EM_ATENDIMENTO || destino == FECHADO;
            case EM_ATENDIMENTO -> destino == AGUARDANDO_CLIENTE || destino == FECHADO;
            case AGUARDANDO_CLIENTE -> destino == EM_ATENDIMENTO || destino == FECHADO;
            case FECHADO -> false;
        };
    }
}
