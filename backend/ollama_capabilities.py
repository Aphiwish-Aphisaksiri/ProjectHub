THINKING_UNSUPPORTED_PREFIXES = ("mistral", "llama3.1")
TOOLS_UNRELIABLE_PREFIXES = ("mistral",)


def model_base_name(model_name: str) -> str:
    return model_name.split(":")[0].lower()


def model_supports_thinking(model_name: str) -> bool:
    base_name = model_base_name(model_name)
    return not any(base_name.startswith(prefix) for prefix in THINKING_UNSUPPORTED_PREFIXES)


def model_supports_tools_by_prefix(model_name: str) -> bool:
    base_name = model_base_name(model_name)
    return not any(base_name.startswith(prefix) for prefix in TOOLS_UNRELIABLE_PREFIXES)