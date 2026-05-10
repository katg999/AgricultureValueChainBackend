@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {
    String module();

    String action(); // VIEW, CREATE, EDIT, APPROVE, DELETE
}