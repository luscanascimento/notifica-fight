# Retrofit reads generic signatures and annotations at runtime.
-keepattributes Signature, RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keep,allowshrinking,allowobfuscation interface retrofit2.http.*
